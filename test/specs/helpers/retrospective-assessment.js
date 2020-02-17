const assert = require('assert');
const helper = require('../../../lib/helpers/retrospective-assessment');

describe('retrospective-assessment', () => {

  describe('required', () => {

    it('returns false if not passed a project', () => {
      assert.equal(helper().required, false);
    });

    it('returns false if project does not match any criteria', () => {
      const project = {
        species: ['mice', 'rats'],
        'species-other': ['Cows'],
        'endangered-animals': false,
        protocols: [
          { severity: 'moderate' },
          { severity: 'mild' }
        ]
      };
      assert.equal(helper(project).required, false);
    });

    it('returns true if project uses horses', () => {
      const project = {
        species: ['mice', 'rats', 'horses'],
        'endangered-animals': false,
        protocols: [
          { severity: 'moderate' },
          { severity: 'mild' }
        ]
      };
      assert.equal(helper(project).required, true);
    });

    it('returns true if project uses an "other" species which matches a restricted species', () => {
      const project = {
        species: ['mice', 'rats'],
        'species-other': ['Rhesus macaques'],
        'endangered-animals': false,
        protocols: [
          { severity: 'moderate' },
          { severity: 'mild' }
        ]
      };
      assert.equal(helper(project).required, true);
    });

    it('returns true if project uses endangered species', () => {
      const project = {
        species: ['mice', 'rats'],
        'endangered-animals': true,
        protocols: [
          { severity: 'moderate' },
          { severity: 'mild' }
        ]
      };
      assert.equal(helper(project).required, true);
    });

    it('returns true if project has a severe protocol', () => {
      const project = {
        species: ['mice', 'rats'],
        'endangered-animals': false,
        protocols: [
          { severity: 'moderate' },
          { severity: 'mild' },
          { severity: 'severe' }
        ]
      };
      assert.equal(helper(project).required, true);
    });

  });

  describe('condition', () => {

    it('returns false if not passed a project', () => {
      assert.equal(helper().condition, false);
    });

    it('returns true if `retrospectiveAssessment` property is true', () => {
      const project = {
        retrospectiveAssessment: true
      };
      assert.equal(helper(project).condition, true);
    });

    it('returns false if `retrospectiveAssessment` property is false', () => {
      const project = {
        retrospectiveAssessment: false
      };
      assert.equal(helper(project).condition, false);
    });

    it('returns true if `retrospectiveAssessment` is an object with child property `retrospective-assessment-required` that is true', () => {
      const project = {
        retrospectiveAssessment: {
          'retrospective-assessment-required': true
        }
      };
      assert.equal(helper(project).condition, true);
    });

    it('returns true if there is a `retrospective-assessment` condition', () => {
      const project = {
        conditions: [
          { key: 'other-condition' },
          { key: 'retrospective-assessment' }
        ]
      };
      assert.equal(helper(project).condition, true);
    });

    it('prioritises the top-level property if it exists alongside conditions', () => {
      const project = {
        retrospectiveAssessment: false,
        conditions: [
          { key: 'other-condition' },
          { key: 'retrospective-assessment' }
        ]
      };
      assert.equal(helper(project).condition, false);
    });

    it('returns false if no matching conditions and no top-level property', () => {
      const project = {
        conditions: [
          { key: 'other-condition' }
        ]
      };
      assert.equal(helper(project).condition, false);
    });

  });

});
