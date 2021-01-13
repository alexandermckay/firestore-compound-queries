_I was looking into how Firestore queries data and had the idea of comparing indexes prior to reading documents as a relatively unintensive - O(N) - way of enabling multiple range operators._

```javascript
const compound = db.compound();
const whereA1 = ["price", ">", 10];
const whereA2 = ["price", "<", 20];
const whereB1 = ["rating", ">=", 4.5];
compound("products", [whereA1, whereA2, whereB1, whereC1]);
```

- Run `whereA1` & `whereA2` as they are the same field (`price`) only reading the index and delaying reading the documents themselves.

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

- Run `whereB1` as if it is an independent query returning only the index keys that match the query

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

- Run `whereC1` as if it is an independent query returning only the index keys that match the query

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

```

```
