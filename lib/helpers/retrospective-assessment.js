const {
  intersection,
  values,
  flatten,
  isUndefined,
  isPlainObject,
  some,
  reduce
} = require('lodash');

const { projectSpecies } = require('@ukhomeoffice/asl-constants');
const species = flatten(values(projectSpecies));

const catsDogsEquidae = [
  'beagles',
  'other-dogs',
  'cats',
  'horses'
];

const nhp = [
  // current nhps
  'marmosets',
  'cynomolgus',
  'rhesus',
  'other-nhps',

  // legacy nhps
  'prosimians',
  'vervets',
  'baboons',
  'squirrel-monkeys',
  'other-old-world',
  'other-new-world',
  'apes'
];

function calculateRA(versionData) {
  if (!versionData) {
    return {};
  }

  const hasCatsDogsEquidaeOther = !!intersection(versionData['species-other'], catsDogsEquidae.map(n => (species.find(s => s.value === n) || {}).label)).length;
  const hasCatsDogsEquidae = !!intersection(versionData.species, catsDogsEquidae).length || hasCatsDogsEquidaeOther;

  const hasNhpOther = !!intersection(versionData['species-other'], nhp.map(n => (species.find(s => s.value === n) || {}).label)).length;
  const hasNonHumanPrimates = !!intersection(versionData.species, nhp).length || hasNhpOther;

  const hasEndangeredAnimals = !!versionData['endangered-animals'];
  const hasSevereProtocols = (versionData.protocols || []).filter(p => p && !p.deleted).some(p => (p.severity || '').match(/severe/ig));
  const isTrainingLicence = !!versionData['training-licence'];

  return {
    hasCatsDogsEquidae,
    hasNonHumanPrimates,
    hasEndangeredAnimals,
    hasSevereProtocols,
    isTrainingLicence
  };
}

function isRequired(versionData) {
  if (!versionData) {
    return false;
  }
  return some(calculateRA(versionData));
}

function addedByAsru(versionData) {
  if (!versionData) {
    return false;
  }
  if (!isUndefined(versionData.retrospectiveAssessment)) {
    // legacy licences may have an object containing a boolean/
    if (isPlainObject(versionData.retrospectiveAssessment)) {
      return !!versionData.retrospectiveAssessment['retrospective-assessment-required'];
    }
    // now saved as a boolean
    return !!versionData.retrospectiveAssessment;
  }
  // previous new licences contained a 'retrospective-assessment' condition.
  if (versionData.conditions && versionData.conditions.find(c => c.key === 'retrospective-assessment')) {
    return true;
  }
  return false;
}

function getReasons(versionData) {
  if (!versionData) {
    return {};
  }

  const reasons = {
    ...calculateRA(versionData),
    addedByAsru: addedByAsru(versionData)
  };

  return reduce(reasons, (result, val, key) => {
    if (val) {
      result[key] = val;
    }
    return result;
  }, {});
}

module.exports = {
  isRequired,
  addedByAsru,
  getReasons
};
