import { Router, Request, Response } from 'express';
import { BrandguardService } from '../services/brandguardService';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'BrandGuard Intelligence API',
    timestamp: new Date().toISOString(),
  });
});

// Brands
apiRouter.get('/brands', (_req: Request, res: Response) => {
  res.json({ brands: BrandguardService.getBrands() });
});

apiRouter.get('/brands/:brandId', (req: Request, res: Response) => {
  const brand = BrandguardService.getBrandById(req.params.brandId);
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }
  res.json({ brand });
});

apiRouter.get('/brands/:brandId/findings', (req: Request, res: Response) => {
  const findings = BrandguardService.getFindings(req.params.brandId);
  res.json({ findings });
});

apiRouter.get('/brands/:brandId/assets', (req: Request, res: Response) => {
  const assets = BrandguardService.getAssets(req.params.brandId);
  res.json({ assets });
});

apiRouter.get('/brands/:brandId/scans', (req: Request, res: Response) => {
  const scans = BrandguardService.getScans(req.params.brandId);
  res.json({ scans });
});

// Lookalike & profile intelligence analysis
apiRouter.post('/analyze/lookalike', (req: Request, res: Response) => {
  const { brand_name, candidate_name, aliases } = req.body || {};
  if (!brand_name || !candidate_name) {
    return res.status(400).json({ error: 'brand_name and candidate_name are required' });
  }
  const result = BrandguardService.analyzeLookalike(brand_name, candidate_name, aliases || []);
  res.json(result);
});

apiRouter.post('/analyze/parse-profile', (req: Request, res: Response) => {
  const { input, platform } = req.body || {};
  if (!input) {
    return res.status(400).json({ error: 'input is required' });
  }
  const parsed = BrandguardService.parseProfile(input, platform);
  res.json(parsed);
});

// Review finding
apiRouter.post('/findings/:id/review', (req: Request, res: Response) => {
  const { status, note } = req.body || {};
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }
  const result = BrandguardService.updateFindingStatus(req.params.id, status, note || '');
  res.json(result);
});

// Trigger scan
apiRouter.post('/scans/run', (req: Request, res: Response) => {
  const { brand_id, source_slugs } = req.body || {};
  if (!brand_id) {
    return res.status(400).json({ error: 'brand_id is required' });
  }
  const scan = BrandguardService.triggerScan(brand_id, source_slugs);
  res.json({ scan });
});

// Sources and Evaluation
apiRouter.get('/sources', (_req: Request, res: Response) => {
  res.json({ sources: BrandguardService.getSources() });
});

apiRouter.get('/evaluation', (_req: Request, res: Response) => {
  res.json({ evaluation: BrandguardService.getEvaluationMetrics() });
});
