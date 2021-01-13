const { v4: uuid } = require("uuid");
const faker = require("faker");

const matched_price = {};
const matched_rating = {};
const matched_distance = {};
const matched_test = {};

const n = 5000000;

for (let i = 0; i < n; i++) {
  const id = uuid();
  matched_price[id] = faker.random.boolean();
  matched_rating[id] = faker.random.boolean();
  matched_distance[id] = faker.random.boolean();
  matched_test[id] = faker.random.boolean();
}

// function allTrue(id, queriesList) {
//   return queriesList.every((obj) => obj[id]);
// }

function combineIndexes(primary, second, third, fourth) {
  let result = {};
  for (const property in primary) {
    if (second[property] && third[property] && fourth[property])
      result[property] = true;
  }
  return result;
}

console.time("combineIndexes");
const result = combineIndexes(
  matched_price,
  matched_rating,
  matched_distance,
  matched_test
);

console.timeEnd("combineIndexes");

console.log(Object.keys(result).length);
