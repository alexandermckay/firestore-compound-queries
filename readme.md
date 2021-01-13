## Outline

_I was looking into how Firestore queries data and had the idea of comparing indexes prior to reading documents as a relatively unintensive - O(N) - way of enabling multiple range operators._

_I really enjoy working with Firestore, particularly the triggers and the development environment (emulators, etc), however when filtering across many fields the experience falls short._

_I recognise that this is somewhat processor intensive but I am recommending that this processing occurs client-side._

### Process

1. Each query is run individually
2. Each query returns a subset of an index structured as a map with the shape `{[doc_id]: true}`
3. The maps are combined client side with the `combineIndexes` function
4. A final query is sent to `firestore` with document ids from a collection that should be retrieved

```javascript
const compound = firestore.compound();
const wherePriceGt = ["price", ">", 10];
const wherePriceLt = ["price", "<", 20];
const whereRating = ["rating", ">=", 4.5];
const whereDistance = ["distance", "<", 50];
compound("products", [wherePriceGt, wherePriceLt, whereRating, whereDistance]);
```

- Run `wherePriceGt` & `wherePriceLt` as they are the same field (`price`) only reading the index and delaying reading the documents themselves.

| price | doc_id |
| ----- | ------ |
| 5     | aaa    |
| 11    | bbb    |
| 17    | ccc    |
| 19    | ddd    |
| 21    | eee    |

```javascript
const matched_price = {
  bbb: true,
  ccc: true,
  ddd: true,
};
```

- Run `whereRating` as if it is an independent query returning only the index keys that match the query

| rating | doc_id |
| ------ | ------ |
| 1      | ccc    |
| 2      | bbb    |
| 4.5    | aaa    |
| 5      | ddd    |
| 5      | eee    |

```javascript
const matched_rating = {
  aaa: true,
  ddd: true,
  eee: true,
};
```

- Run `whereDistance` as if it is an independent query returning only the index keys that match the query

| distance | doc_id |
| -------- | ------ |
| 10       | ccc    |
| 20       | bbb    |
| 40       | ddd    |
| 60       | aaa    |
| 100      | eee    |

```javascript
const matched_distance = {
  ccc: true,
  bbb: true,
  ddd: true,
};
```

- Combine the `matched_property` objects

```javascript
function allTrue(id, queriesList) {
  return queriesList.every((obj) => obj[id]);
}
function combineIndexes(primaryQuery, secondaryQueries) {
  let result = {};
  for (const property in primaryQuery) {
    if (allTrue(property, secondaryQueries)) result[property] = true;
  }
  return result;
}
const result = combineIndexes(matched_price, [
  matched_rating,
  matched_distance,
]);
// => {ddd: true}
```

- Only at this point are the document reads executed
