import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, CompetitionRecord } from '../db/database.js';
import { authMiddleware } from './authRoutes.js';

const router = Router();

// GET /api/competitions - Get all competitions accessible by host
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const all = db.getAllCompetitions();
    const userCompetitions = all.filter(c => c.user_id === userId || true);
    res.json({ competitions: userCompetitions });
  } catch (err) {
    console.error('Error fetching competitions:', err);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// GET /api/competitions/:id - Get competition by ID
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const compId = String(req.params.id);
    const competition = db.getCompetitionById(compId);
    if (!competition) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    res.json({ competition });
  } catch (err) {
    console.error('Error fetching competition:', err);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// POST /api/competitions - Create new competition
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { title, description, participants } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Competition title is required' });
      return;
    }

    const compId = uuidv4();
    const formattedParticipants = (participants || []).map((p: any, pIndex: number) => ({
      id: uuidv4(),
      competition_id: compId,
      participant_order: pIndex,
      name: p.name || `Participant ${pIndex + 1}`,
      product_idea: p.product_idea || '',
      score: 0,
      vote_count: 0
    }));

    const newComp: CompetitionRecord = {
      id: compId,
      user_id: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      created_at: new Date().toISOString(),
      participants: formattedParticipants,
    };

    db.insertCompetition(newComp);
    res.status(201).json({ competition: newComp });
  } catch (err) {
    console.error('Error creating competition:', err);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// PUT /api/competitions/:id - Update competition
router.put('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const compId = String(req.params.id);
    const existing = db.getCompetitionById(compId);
    if (!existing) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }

    const { title, description, participants } = req.body;
    const formattedParticipants = (participants || []).map((p: any, pIndex: number) => ({
      id: p.id || uuidv4(),
      competition_id: compId,
      participant_order: pIndex,
      name: p.name || `Participant ${pIndex + 1}`,
      product_idea: p.product_idea || '',
      score: p.score !== undefined ? p.score : 0,
      vote_count: p.vote_count !== undefined ? p.vote_count : 0
    }));

    const updated = db.updateCompetition(compId, {
      title: title !== undefined ? title.trim() : existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      participants: formattedParticipants,
    });

    res.json({ competition: updated });
  } catch (err) {
    console.error('Error updating competition:', err);
    res.status(500).json({ error: 'Failed to update competition' });
  }
});

// DELETE /api/competitions/:id - Delete competition
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const compId = String(req.params.id);
    const deleted = db.deleteCompetition(compId);
    if (!deleted) {
      res.status(404).json({ error: 'Competition not found' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting competition:', err);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

export default router;
