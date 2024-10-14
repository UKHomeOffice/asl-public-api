const { Router } = require('express');
const { permissions } = require('../../middleware');
const { BadRequestError } = require('../../errors');
const { flatten } = require('lodash');

const app = Router({ mergeParams: true });

app.use(permissions('establishment.rops'));

app.get('/overview', (req, res, next) => {
  const { Project } = req.models;
  const { ropsYear, establishmentId } = req.query;

  if (!ropsYear) {
    throw new BadRequestError('ropsYear must be provided');
  }

  const ropsDueQuery = Project.query()
    .count()
    .where('projects.establishmentId', establishmentId)
    .whereRopsDue(ropsYear);

  const ropsSubmittedQuery = ropsDueQuery.clone().whereRopsSubmitted(ropsYear);

  return Promise.all([ropsDueQuery, ropsSubmittedQuery])
    .then(([ropsDue, ropsSubmitted]) => {
      const due = parseInt(ropsDue[0].count, 10);
      const submitted = parseInt(ropsSubmitted[0].count, 10);
      res.response = {
        year: ropsYear,
        establishmentId,
        due,
        submitted,
        outstanding: due - submitted
      };
    })
    .then(() => next())
    .catch(next);
});

const getSubPurpose = row => {
  switch (row.purposes) {
    case 'basic':
      return row.basicSubpurposes;
    case 'regulatory':
      return row.regulatorySubpurposes;
    case 'translational':
      return row.translationalSubpurposes;
  }
};

const getSubPurposeOther = row => {
  const subpurpose = getSubPurpose(row);

  const yeps = [
    'other',
    'routine-other',
    'other-efficacy',
    'other-toxicity-ecotoxicity',
    'other-toxicity-lethal',
    'other-toxicity'
  ];

  if (!yeps.includes(subpurpose)) {
    return null;
  }

  const id = row.subpurposeOther;

  if (!id) {
    return null;
  }

  const others = flatten([
    'basicSubpurposesOther',
    'regulatorySubpurposesOther',
    'regulatorySubpurposesOtherEfficacy',
    'regulatorySubpurposesOtherToxicityEcotoxicity',
    'regulatorySubpurposesOtherToxicity',
    'regulatorySubpurposesOtherToxicityLethal',
    'translationalSubpurposesOther'
  ].map(key => row[key]));

  return (others.find(other => other && other.id === id) || {}).value;
};

const getLegislationOther = row => {
  const purpose = row.purposes;
  if (purpose !== 'regulatory') {
    return null;
  }

  const subpurpose = row.regulatorySubpurposes;

  const nopes = [
    'routine-blood',
    'routine-monoclonal',
    'routine-other'
  ];

  if (nopes.includes(subpurpose)) {
    return null;
  }

  const id = row.legislationOther;

  if (!id) {
    return null;
  }

  return ((row.regulatoryLegislationOther || []).find(opt => opt.id === id) || {}).value;
};

const getOtherSpeciesGroup = (ropSpecies, procedureSpecies) => {
  if (!ropSpecies) {
    return '';
  }
  if ((ropSpecies.otherSpecies || []).includes(procedureSpecies)) {
    return 'other-unspecified';
  }
  const otherSpeciesGroup = Object.keys(ropSpecies)
    .filter(key => key.includes('species-other-') && ropSpecies[key].includes(procedureSpecies))
    .pop();
  return (otherSpeciesGroup || '').replace('species-', ''); // "other-rodents" / "other-fish" / "other-reptiles" / etc
};

const normaliseBools = value => {
  if (value === true) {
    return 'y';
  }
  if (value === false) {
    return 'n';
  }
  return value;
};

const normalise = row => {
  Object.keys(row).forEach(key => {
    row[key] = normaliseBools(row[key]);
  });
  return row;
};

app.get('/download', (req, res, next) => {
  const { year } = req.query;
  const { Project } = req.models;

  if (!year) {
    throw new BadRequestError('year must be provided');
  }

  return Project.query()
    .select(
      'projects.licenceNumber',
      'projects.establishmentId',
      'projects.title',
      'projects.status as projectStatus',
      'projects.issueDate',
      'projects.expiryDate',
      'projects.revocationDate',
      'licenceHolder.firstName',
      'licenceHolder.lastName',
      'licenceHolder.email',
      'rops.id AS ropId',
      'rops.year',
      'rops.species AS ropSpecies',
      'rops.postnatal',
      'rops.endangered',
      'rops.endangeredDetails',
      'rops.nmbas',
      'rops.generalAnaesthesia',
      'rops.generalAnaesthesiaDetails',
      'rops.rodenticide',
      'rops.rodenticideDetails',
      'rops.productTesting',
      'rops.productTestingTypes',
      'rops.basicSubpurposesOther',
      'rops.regulatorySubpurposesOther',
      'rops.regulatorySubpurposesOtherEfficacy',
      'rops.regulatorySubpurposesOtherToxicityEcotoxicity',
      'rops.regulatorySubpurposesOtherToxicity',
      'rops.regulatorySubpurposesOtherToxicityLethal',
      'rops.translationalSubpurposesOther',
      'rops.regulatoryLegislationOther',
      'rops:procedures.id AS procedureId',
      'rops:procedures.species AS procedureSpecies',
      'rops:procedures.severityNum',
      'rops:procedures.reuse',
      'rops:procedures.endangered',
      'rops:procedures.endangeredDetails',
      'rops:procedures.placesOfBirth',
      'rops:procedures.nhpsOrigin',
      'rops:procedures.nhpsColonyStatus',
      'rops:procedures.nhpsGeneration',
      'rops:procedures.ga',
      'rops:procedures.newGeneticLine',
      'rops:procedures.purposes',
      'rops:procedures.basicSubpurposes',
      'rops:procedures.regulatorySubpurposes',
      'rops:procedures.translationalSubpurposes',
      'rops:procedures.subpurposeOther',
      'rops:procedures.regulatoryLegislation',
      'rops:procedures.regulatoryLegislationOrigin',
      'rops:procedures.legislationOther',
      'rops:procedures.specialTechnique',
      'rops:procedures.severity',
      'rops:procedures.severityHoNote',
      'rops:procedures.severityPersonalNote'
    )
    .joinRelated('licenceHolder')
    .leftJoinRelated('rops.procedures')
    .where('establishmentId', req.establishment.id)
    .whereRopsSubmitted(year)
    .then(rows => {
      res.response = rows.map(row => {
        normalise(row);
        row.subPurpose = getSubPurpose(row);
        row.subPurposeOther = getSubPurposeOther(row);
        row.legislationOther = getLegislationOther(row);
        row.species = row.procedureSpecies;
        const otherSpecies = getOtherSpeciesGroup(row.ropSpecies, row.procedureSpecies);
        if (otherSpecies) {
          row.otherSpecies = row.species;
          row.species = otherSpecies;
        }
        return row;
      });
    })
    .then(() => next())
    .catch(next);
});

app.get('/', (req, res, next) => {
  const { Project } = req.models;
  const { limit, offset, sort, ropsYear, ropsStatus = 'outstanding' } = req.query;

  if (!ropsYear) {
    throw new BadRequestError('ropsYear must be provided');
  }

  return Promise.resolve()
    .then(() => {
      return Project.scopeToParams({
        establishmentId: req.establishment.id,
        offset,
        limit,
        sort,
        status: ['active', 'expired', 'revoked'],
        ropsStatus,
        ropsYear
      }).getAll();
    })
    .then(({ total, projects }) => {
      res.meta.count = projects.total;
      res.meta.total = total;
      res.response = projects.results;
      next();
    })
    .catch(next);
});

module.exports = app;
