const faker = require("faker");
const { prop, and, gt, gte, lt, lte, propEq, path, __ } = require("ramda");

// Seed mock data
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

// Functions
const operatorMap = {
  ">": gt,
  ">=": gte,
  "<": lt,
  "<=": lte,
};

function createIndexSubsetServerSide(collection, [key, operatorKey, value]) {
  const operator = prop(operatorKey, operatorMap);
  let indexSubset = {};
  for (const doc in collection) {
    const queryPassed = operator(path([doc, key], collection), value);
    if (queryPassed) indexSubset[doc] = true;
  }
  return indexSubset;
}

function combineIndexesClientSide(...indexSubsets) {
  let result = {};
  let cond;
  const [primary, second, third] = indexSubsets;
  const nthQuery = propEq("length", __, indexSubsets);
  const twoQueries = nthQuery(2);
  const threeQueries = nthQuery(3);
  for (const property in primary) {
    const nth2Prop = prop(property, second);
    const nth3Prop = prop(property, third);
    if (twoQueries) cond = nth2Prop;
    else if (threeQueries) cond = and(nth2Prop, nth3Prop);
    else throw new Error("Maximum of 3 Ranged queries supported");
    if (cond) result[property] = true;
  }
  return result;
}

// Firestore mock
const firestore = {
  compound: (collection, queries) => {
    const indexSubsets = queries.map(
      // createIndexSubsetServerSide would occur server-side
      (query) => createIndexSubsetServerSide(collection, query)
    );
    // combineIndexesClientSide would occur client-side and then a speciality query could return all the docs present in the docIdMap
    const docIdMap = combineIndexesClientSide(...indexSubsets);
    return docIdMap;
  },
};

// Mock query
const wherePriceGt = ["price", ">", 10];
const whereRating = ["rating", ">=", 4.5];
const whereDistance = ["distance", "<", 50];

console.log(
  firestore.compound(products, [wherePriceGt, whereRating, whereDistance])
);
