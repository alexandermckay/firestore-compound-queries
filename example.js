const faker = require("faker");
const { gt, gte, lt, lte } = require("ramda");

// SEED MOCK DATA

const products = {};
const seedAmount = 10000;

for (let i = 0; i < seedAmount; i++) {
  const id = faker.random.uuid();
  products[id] = {
    price: faker.random.number(100),
    rating: faker.random.number(5),
    distance: faker.random.number(100),
  };
}

// FUNCTIONS

const operatorMap = {
  ">": gt,
  ">=": gte,
  "<": lt,
  "<=": lte,
};

function createIndexSubset(collection, [key, operatorKey, value]) {
  const operator = operatorMap[operatorKey];
  let indexSubset = {};
  for (const doc in collection) {
    if (operator(collection[doc][key], value)) indexSubset[doc] = true;
  }
  return indexSubset;
}

function combineIndexes(primary, second, third) {
  let result = {};
  for (const property in primary) {
    if (second[property] && third[property]) result[property] = true;
  }
  return result;
}

// MOCK QUERY

const wherePriceGt = ["price", ">", 10];
const whereRating = ["rating", ">=", 4.5];
const whereDistance = ["distance", "<", 50];

const firestore = {
  compound: (collection, queries) => {
    const [priceIndex, ratingIndex, distanceIndex] = queries.map(
      // createIndexSubset would occur server-side
      (query) => createIndexSubset(collection, query)
    );
    // combineIndexes would occur client-side and then a speciality query could return all the docs present in the docIdMap
    const docIdMap = combineIndexes(priceIndex, ratingIndex, distanceIndex);
    return docIdMap;
  },
};

console.log(
  firestore.compound(products, [wherePriceGt, whereRating, whereDistance])
);
