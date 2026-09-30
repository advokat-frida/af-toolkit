// One citation card open at a time, across every Mentions block on the page.
import { writable } from 'svelte/store';

export const activeCite = writable(null);
