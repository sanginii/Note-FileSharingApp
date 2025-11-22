import { Router } from 'express';
import { noteRoutes } from './notes.js';

// Files use the same route structure as notes
// The distinction is made via the isFile flag
export const fileRoutes = noteRoutes;


