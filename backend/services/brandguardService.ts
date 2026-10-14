import { store } from './store';
import { analyzeCandidateName } from '../engine/lookalikeDetector';
import { parseProfileInput } from '../engine/parseProfile';
import { compareFieldValues } from '../engine/compareFields';
import { computeCharDiff } from '../engine/charDiff';
import { Brand, Finding, OfficialAsset, ScanRun, ReviewStatus } from '../types/brandguard';

export class BrandguardService {
  public static getBrands(): Brand[] {
    return store.getState().brands;
  }

  public static getBrandById(brandId: string): Brand | undefined {
    return store.getState().brands.find((b) => b.id === brandId);
  }

  public static getFindings(brandId?: string): Finding[] {
    const all = store.getState().findings;
    return brandId ? all.filter((f) => f.brand_id === brandId) : all;
  }

  public static getAssets(brandId?: string): OfficialAsset[] {
    const all = store.getState().assets;
    return brandId ? all.filter((a) => a.brand_id === brandId) : all;
  }

  public static getScans(brandId?: string): ScanRun[] {
    const all = store.getState().scans;
    return brandId ? all.filter((s) => s.brand_id === brandId) : all;
  }

  public static getEvaluationMetrics() {
    return store.getState().evaluation;
  }

  public static getSources() {
    return store.getState().sources;
  }

  public static getDatasets() {
    return store.getState().datasets;
  }

  public static analyzeLookalike(brandName: string, candidateName: string, aliases: string[] = []) {
    return analyzeCandidateName(brandName, candidateName, aliases);
  }

  public static parseProfile(input: string, platform?: any) {
    return parseProfileInput(input, platform);
  }

  public static compareFields(official: string, candidate: string, isExactIdentifier = false) {
    return compareFieldValues(official, candidate, isExactIdentifier);
  }

  public static diffCharacters(official: string, candidate: string) {
    return computeCharDiff(official, candidate);
  }

  public static updateFindingStatus(findingId: string, status: ReviewStatus, note = '', version = 1) {
    return store.updateFindingReview(findingId, status, note, version);
  }

  public static triggerScan(brandId: string, sources: string[] = ['social:x', 'social:instagram', 'app:google_play']) {
    return store.runScan(brandId, sources);
  }
}
