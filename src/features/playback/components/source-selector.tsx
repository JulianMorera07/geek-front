'use client';

import * as React from 'react';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs';
import { qualityLabel } from '@/features/playback/labels';
import { cn } from '@/lib/utils';
import type { PlaybackSource } from '@/features/playback/api/types';

export interface SourceSelectorProps {
  sources: PlaybackSource[];
  value: string | null;
  onChange: (sourceId: string) => void;
}

interface ProviderGroup {
  displayName: string;
  sources: PlaybackSource[];
}

/** Agrupa por `providerDisplayName` (ej. "Kitsune", "Ronin") preservando el orden en que aparece cada grupo — nunca por `providerId`, ese campo es solo lógica interna. */
function groupByProvider(sources: PlaybackSource[]): ProviderGroup[] {
  const groups: ProviderGroup[] = [];
  const indexByName = new Map<string, number>();

  for (const source of sources) {
    const existingIndex = indexByName.get(source.providerDisplayName);
    if (existingIndex === undefined) {
      indexByName.set(source.providerDisplayName, groups.length);
      groups.push({ displayName: source.providerDisplayName, sources: [source] });
    } else {
      groups[existingIndex].sources.push(source);
    }
  }

  return groups;
}

/** `source.serverName` (ej. "Mega", "Streamtape") — nombre real del embed, sin problema mostrarlo. */
function serverLabel(source: PlaybackSource): string {
  return `${source.serverName} · ${qualityLabel(source.quality)}`;
}

/**
 * Selector de fuente en dos niveles: pestañas por proveedor
 * (`providerDisplayName`, un alias de marca que manda el backend — ej.
 * "Kitsune", "Ronin", "Sakura") y, dentro de cada una, botones por servidor
 * real (`serverName` — "Mega", "Streamtape"...). `providerId` nunca se pinta
 * en pantalla, solo viaja de vuelta en `onChange` → `POST
 * /playback/sources/select` vía `source.id`.
 */
function SourceSelector({ sources, value, onChange }: Readonly<SourceSelectorProps>) {
  const groups = React.useMemo(() => groupByProvider(sources), [sources]);

  const groupOfValue = groups.find((g) => g.sources.some((s) => s.id === value))?.displayName;
  const [manualTab, setManualTab] = React.useState<string | null>(null);
  const activeTab = manualTab && groups.some((g) => g.displayName === manualTab)
    ? manualTab
    : (groupOfValue ?? groups[0]?.displayName ?? null);

  if (groups.length === 0) return null;

  // Un solo proveedor: las pestañas no aportan nada, se muestran los
  // servidores directo.
  if (groups.length === 1) {
    return (
      <div className="flex flex-wrap gap-2">
        {groups[0].sources.map((source) => (
          <button
            key={source.id}
            type="button"
            disabled={!source.isActive}
            onClick={() => onChange(source.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              source.id === value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-accent',
              !source.isActive && 'cursor-not-allowed opacity-50',
            )}
          >
            {serverLabel(source)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(next) => setManualTab(next as string)}>
      <TabsList>
        {groups.map((group) => (
          <TabsTab key={group.displayName} value={group.displayName}>
            {group.displayName}
          </TabsTab>
        ))}
      </TabsList>
      {groups.map((group) => (
        <TabsPanel key={group.displayName} value={group.displayName}>
          <div className="flex flex-wrap gap-2">
            {group.sources.map((source) => (
              <button
                key={source.id}
                type="button"
                disabled={!source.isActive}
                onClick={() => onChange(source.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  source.id === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-accent',
                  !source.isActive && 'cursor-not-allowed opacity-50',
                )}
              >
                {serverLabel(source)}
              </button>
            ))}
          </div>
        </TabsPanel>
      ))}
    </Tabs>
  );
}

export { SourceSelector };
