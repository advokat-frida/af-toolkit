import { describe, expect, it } from 'vitest';
import { WIZARDS, SOURCES, SOURCE_MANIFEST, sourceIdsForState } from '../../src/lib/engine/council.js';
import { beginJurisdictions, answerJurisdiction, buildJurisdictionRecord, validateJurisdictionRoutes } from '../../src/lib/engine/jurisdictions.js';

const COHORT = ['CA','CO','CT','DE','FL','IN','IA','KY','MD','MN','MT','NE','NH','NJ','OR','RI','TN','TX','UT','VA'].map(id => `US-${id}`).sort();

for (const wizardId of ['us-applicability', 'us-divergence']) {
  describe(wizardId, () => {
    it('all_twenty_current_state_routes_are_isolated_and_terminate_with_cited_results', () => {
      const wizard = WIZARDS[wizardId];
      expect(wizard).toBeTruthy();
      expect(wizard.jurisdictions.toSorted()).toEqual(COHORT);
      expect(validateJurisdictionRoutes(wizard)).toEqual([]);
      for (const route of wizard.jurisdictionRoutes) {
        const seen = new Set();
        function visit(nodeId) {
          if (seen.has(nodeId)) return;
          seen.add(nodeId);
          const node = wizard.nodes[nodeId];
          expect(node.cites?.length, `${route.id}:${nodeId}`).toBeGreaterThan(0);
          for (const cite of node.cites) {
            expect(SOURCES[cite].provenance, cite).toMatch(/^https:\/\//);
            expect(SOURCES[cite].juris, `${route.id}:${cite}`).toMatch(new RegExp(`^(${route.id}|US \\(federal\\)|INTL)$`));
            expect(SOURCE_MANIFEST[cite].status, cite).not.toBe('practitioner-reviewed');
          }
          if (node.type === 'question') {
            for (const option of node.opts) visit(option.goto);
          } else {
            expect(node.type).toBe('outcome');
            expect(node.title).toBeTruthy();
            expect(node.summary).toBeTruthy();
          }
        }
        visit(route.start);
      }
    });

    it('every_not_sure_branch_reaches_an_explicit_missing_fact_outcome', () => {
      const wizard = WIZARDS[wizardId];
      expect(wizard).toBeTruthy();
      const unknown = Object.entries(wizard.nodes).flatMap(([id, node]) => (node.opts || []).filter(option => /not sure|unknown|do not know|don't know/i.test(option.label)).map(option => [id, option]));
      expect(unknown.length).toBeGreaterThanOrEqual(20);
      for (const [id, option] of unknown) {
        const outcome = wizard.nodes[option.goto];
        expect(outcome.type, id).toBe('outcome');
        expect(outcome.tier, id).toBe('warn');
        expect(outcome.missingFacts?.length, id).toBeGreaterThan(0);
        for (const fact of outcome.missingFacts) {
          expect(fact.fact, id).toBeTruthy();
          expect(fact.owner, id).toBeTruthy();
          expect(fact.why, id).toBeTruthy();
        }
      }
    });

    it('a_multi_state_record_contains_each_result_and_its_own_facts_sources_and_source_notes', () => {
      const wizard = WIZARDS[wizardId];
      let runs = beginJurisdictions(wizard, ['US-CA', 'US-TX']);
      for (const selected of runs) {
        for (let guard = 0; guard < 30; guard++) {
          const run = runs.find(item => item.id === selected.id);
          if (run.outcomeId) break;
          const node = wizard.nodes[run.currentNodeId];
          const unknown = node.opts.findIndex(option => /not sure|unknown|do not know|don't know/i.test(option.label));
          runs = answerJurisdiction(wizard, runs, selected.id, unknown >= 0 ? unknown : 0);
        }
      }
      expect(runs.every(run => run.outcomeId)).toBe(true);
      const record = buildJurisdictionRecord({ wizardId, runs, date: new Date('2026-09-22T12:00:00Z') });
      expect(record).toContain('Selected jurisdictions: California, Texas');
      for (const run of runs) {
        expect(record).toContain(wizard.nodes[run.outcomeId].title);
        for (const source of sourceIdsForState(wizard, run.history, null, run.outcomeId)) {
          expect(record).toContain(SOURCES[source].provenance);
          if (SOURCES[source].note) expect(record).toContain('Source note:');
        }
      }
      expect(record).toContain('automated-check-only');
      expect(record).not.toContain('Legal sources reviewed through:');
      expect(() => buildJurisdictionRecord({ wizardId, runs: beginJurisdictions(wizard, ['US-CA']) })).toThrow();
    });
  });
}

it('every_state_duties_route_covers_a_compliance_concern_without_putting_the_cure_advice_in_the_answer', () => {
  const wizard = WIZARDS['us-divergence'];
  for (const route of wizard.jurisdictionRoutes) {
    const prefix = route.id.slice(3).toLowerCase();
    const use = wizard.nodes[`${prefix}-use`];
    const option = use.opts.find(answer => answer.label === 'A compliance concern or regulator notice is involved');
    expect(option, route.id).toBeTruthy();
    expect(option.desc, route.id).toBeUndefined();
    const outcome = wizard.nodes[option.goto];
    expect(outcome.type, route.id).toBe('outcome');
    expect(outcome.summary, route.id).toMatch(/cure|correct|remediat/i);
    expect(outcome.actions?.length, route.id).toBeGreaterThan(0);
    expect(outcome.cites.some(id => SOURCES[id]?.juris === route.id), route.id).toBe(true);
    expect(wizard.nodes[`${prefix}-overview`].cites, route.id).toEqual(expect.arrayContaining(outcome.cites));
  }
});
