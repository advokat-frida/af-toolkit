// Shared by the content compiler and runtime. No generated data or browser dependencies.
export function validateJurisdictionRoutes(wizard) {
  if (wizard.jurisdictionRoutes === undefined) return [];
  const errors = [];
  const routes = wizard.jurisdictionRoutes;
  if (!Array.isArray(routes) || !routes.length) return ['jurisdictionRoutes must be a non-empty array'];
  const ids = new Set();
  const owners = new Map();
  const root = wizard.nodes?.[wizard.start];
  for (const route of routes) {
    if (!route || typeof route.id !== 'string' || !route.label || !route.start) {
      errors.push('each jurisdiction route needs id, label and start');
      continue;
    }
    if (ids.has(route.id)) errors.push(`duplicate jurisdiction route ${route.id}`);
    ids.add(route.id);
    if (!wizard.jurisdictions?.includes(route.id)) errors.push(`${route.id} is not in jurisdictions`);
    if (!root?.opts?.some(option => option.goto === route.start)) errors.push(`${route.id} is not reachable directly from the selector`);
    if (!wizard.nodes?.[route.start]) errors.push(`${route.id} start does not resolve`);
    const visited = new Set();
    function visit(id, ancestors) {
      if (ancestors.has(id)) { errors.push(`${route.id} has a cycle at ${id}`); return; }
      if (visited.has(id)) return;
      visited.add(id);
      if (id === wizard.start) errors.push(`${route.id} crosses back into the selector`);
      if (owners.has(id) && owners.get(id) !== route.id) errors.push(`${id} is shared across ${owners.get(id)} and ${route.id}`);
      owners.set(id, route.id);
      const next = new Set(ancestors).add(id);
      for (const option of wizard.nodes?.[id]?.opts || []) visit(option.goto, next);
    }
    visit(route.start, new Set());
  }
  if ((wizard.jurisdictions || []).some(id => !ids.has(id))) errors.push('every jurisdiction needs a route');
  return [...new Set(errors)];
}

// This is a bound, not a promise. The label says "at most" because branches end early.
export function maxQuestionsRemaining(wizard, nodeId, seen = new Set()) {
  const node = wizard.nodes?.[nodeId];
  if (node?.type !== 'question' || seen.has(nodeId)) return 0;
  const next = new Set(seen).add(nodeId);
  return 1 + Math.max(0, ...(node.opts || []).map(option => maxQuestionsRemaining(wizard, option.goto, next)));
}
