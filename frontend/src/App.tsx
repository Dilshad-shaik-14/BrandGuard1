import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { store } from './services/store';
import { Sidebar } from './components/shell/Sidebar';
import { TopBar } from './components/shell/TopBar';
import { WelcomeScreen } from './features/welcome/WelcomeScreen';
import { OverviewScreen } from './features/overview/OverviewScreen';
import { FindingsScreen } from './features/findings/FindingsScreen';
import { ScansScreen } from './features/scans/ScansScreen';
import { ProfileScreen } from './features/profile/ProfileScreen';
import { SourcesScreen } from './features/sources/SourcesScreen';
import { EvaluationScreen } from './features/evaluation/EvaluationScreen';

function BrandRouteWrapper({
  Component,
}: {
  Component: React.ComponentType<any>;
}) {
  const { brandId } = useParams<{ brandId: string }>();
  const state = store.getState();
  const brand = state.brands.find((b) => b.id === brandId);

  useEffect(() => {
    if (brandId && brand) {
      store.setActiveBrand(brandId);
    }
  }, [brandId, brand]);

  if (!brand) {
    if (state.brands.length === 0) {
      return <Navigate to="/welcome" replace />;
    }
    return <Navigate to={`/brands/${state.brands[0]!.id}`} replace />;
  }

  const brandFindings = state.findings.filter((f) => f.brand_id === brand.id);
  const brandAssets = state.assets.filter((a) => a.brand_id === brand.id);
  const brandScans = state.scans.filter((s) => s.brand_id === brand.id);
  const latestScan = brandScans[0];
  const brandAssetIds = new Set(brandAssets.map((a) => a.id));
  const brandExclusions = state.exclusions.filter((e) => brandAssetIds.has(e.asset_id));

  return (
    <Component
      brand={brand}
      brands={state.brands}
      findings={brandFindings}
      assets={brandAssets}
      officialAssets={brandAssets}
      exclusions={brandExclusions}
      scans={brandScans}
      latestScan={latestScan}
      datasets={state.datasets}
      sources={state.sources}
      evaluation={state.evaluation}
    />
  );
}

function RootRedirect() {
  const state = store.getState();
  if (state.brands.length === 0) {
    return <Navigate to="/welcome" replace />;
  }
  const targetId = state.activeBrandId || state.brands[0]!.id;
  return <Navigate to={`/brands/${targetId}`} replace />;
}

export default function App() {
  const [appState, setAppState] = useState(store.getState());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setAppState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  const activeBrand = store.getActiveBrand();
  const brandFindings = activeBrand ? appState.findings.filter((f) => f.brand_id === activeBrand.id) : [];
  const openFindingsCount = brandFindings.filter(
    (f) => f.band !== 'ignored' && (f.review_status === 'new' || f.review_status === 'under_review')
  ).length;

  const activeScan = appState.scans.find((s) => s.status === 'running');

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex font-sans">
        {/* Persistent Collapsible Sidebar */}
        {activeBrand && (
          <Sidebar
            brands={appState.brands}
            activeBrand={activeBrand}
            onSelectBrand={(id) => store.setActiveBrand(id)}
            onAddBrand={() => {
              window.location.href = '/welcome';
            }}
            openFindingsCount={openFindingsCount}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TopBar Shell */}
          {activeBrand && (
            <TopBar
              activeBrand={activeBrand}
              brands={appState.brands}
              activeScan={activeScan}
              isSidebarCollapsed={isSidebarCollapsed}
              dataOrigin="Simulated data"
            />
          )}

          <main
            className={`flex-1 transition-all duration-200 ${
              activeBrand ? (isSidebarCollapsed ? 'pl-[68px]' : 'pl-[240px]') : ''
            }`}
          >
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/welcome" element={<WelcomeScreen />} />
              <Route
                path="/brands/:brandId"
                element={<BrandRouteWrapper Component={OverviewScreen} />}
              />
              <Route
                path="/brands/:brandId/findings"
                element={<BrandRouteWrapper Component={FindingsScreen} />}
              />
              <Route
                path="/brands/:brandId/scans"
                element={<BrandRouteWrapper Component={ScansScreen} />}
              />
              <Route
                path="/brands/:brandId/scans/:scanId"
                element={<BrandRouteWrapper Component={ScansScreen} />}
              />
              <Route
                path="/brands/:brandId/profile"
                element={<BrandRouteWrapper Component={ProfileScreen} />}
              />
              <Route
                path="/sources"
                element={
                  <SourcesScreen
                    brands={appState.brands}
                    activeBrand={activeBrand || appState.brands[0]!}
                    sources={appState.sources}
                    datasets={appState.datasets}
                  />
                }
              />
              <Route
                path="/brands/:brandId/evaluation"
                element={<BrandRouteWrapper Component={EvaluationScreen} />}
              />
              {/* 404 Not Found Page */}
              <Route
                path="*"
                element={
                  <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <h1 className="text-[20px] font-bold text-white">
                      Command View Not Found
                    </h1>
                    <p className="text-[13px] text-[var(--text-secondary)] max-w-md">
                      The requested security console path does not exist.
                    </p>
                    <a
                      href="/"
                      className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold flex items-center justify-center"
                    >
                      Return to Command Center
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
