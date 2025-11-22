import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '../utils/password.js';

const router = Router();
const prisma = new PrismaClient();

const createNoteSchema = z.object({
  encryptedData: z.string(),
  encryptedKey: z.string(),
  iv: z.string(),
  authTag: z.string(),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
  maxViews: z.number().int().min(0).default(0),
  isFile: z.boolean().default(false),
  fileName: z.union([z.string(), z.null()]).optional(),
  mimeType: z.union([z.string(), z.null()]).optional(),
  password: z.string().optional(),
});

// Create a new encrypted note
router.post('/', async (req, res) => {
  try {
    const data = createNoteSchema.parse(req.body);
    
    // Hash password if provided and not empty
    let passwordHash: string | null = null;
    let salt: string | null = null;
    if (data.password && data.password.trim().length > 0) {
      const hashed = hashPassword(data.password);
      passwordHash = hashed.hash;
      salt = hashed.salt;
    }
    
    const note = await prisma.secureNote.create({
      data: {
        encryptedData: data.encryptedData,
        encryptedKey: data.encryptedKey,
        iv: data.iv,
        authTag: data.authTag,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        maxViews: data.maxViews,
        isFile: data.isFile,
        fileName: data.fileName || null,
        mimeType: data.mimeType || null,
        passwordHash,
        salt,
      },
    });

    res.json({ id: note.id, createdAt: note.createdAt });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: error.errors,
        received: req.body 
      });
    }
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Verify password for a note
router.post('/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const note = await prisma.secureNote.findUnique({
      where: { id },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (!note.passwordHash || !note.salt) {
      return res.json({ requiresPassword: false });
    }

    if (!password) {
      return res.status(401).json({ error: 'Password required', requiresPassword: true });
    }

    const isValid = verifyPassword(password, note.passwordHash, note.salt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password', requiresPassword: true });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// Get encrypted note (increment view count)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const password = req.query.password as string | undefined;

    const note = await prisma.secureNote.findUnique({
      where: { id },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (note.destroyed) {
      return res.status(410).json({ error: 'Note has been destroyed' });
    }

    // Check if password is required
    if (note.passwordHash && note.salt) {
      if (!password) {
        return res.status(401).json({ error: 'Password required', requiresPassword: true });
      }
      const isValid = verifyPassword(password, note.passwordHash, note.salt);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid password', requiresPassword: true });
      }
    }

    // Check time-based expiry
    if (note.expiresAt && new Date() > note.expiresAt) {
      // Mark as destroyed
      await prisma.secureNote.update({
        where: { id },
        data: { destroyed: true },
      });
      return res.status(410).json({ error: 'Note has expired' });
    }

    // Check view-based expiry
    if (note.maxViews > 0 && note.viewCount >= note.maxViews) {
      await prisma.secureNote.update({
        where: { id },
        data: { destroyed: true },
      });
      return res.status(410).json({ error: 'Note has exceeded max views' });
    }

    // Increment view count
    const updatedNote = await prisma.secureNote.update({
      where: { id },
      data: { viewCount: note.viewCount + 1 },
    });

    // If this was the last view, mark as destroyed
    if (note.maxViews > 0 && updatedNote.viewCount >= note.maxViews) {
      await prisma.secureNote.update({
        where: { id },
        data: { destroyed: true },
      });
    }

    res.json({
      encryptedData: note.encryptedData,
      encryptedKey: note.encryptedKey,
      iv: note.iv,
      authTag: note.authTag,
      isFile: note.isFile,
      fileName: note.fileName,
      mimeType: note.mimeType,
      viewCount: updatedNote.viewCount,
      maxViews: note.maxViews,
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// Delete note (manual cleanup)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.secureNote.update({
      where: { id },
      data: { destroyed: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export { router as noteRoutes };

