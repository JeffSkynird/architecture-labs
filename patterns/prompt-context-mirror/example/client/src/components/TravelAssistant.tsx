import { useMemo, useRef, useState, useCallback } from 'react';

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';

type SearchParams = { origin: string; destination: string; departureDate: string; returnDate: string; passengers: number; nonStopOnly: boolean; };
type SearchResults = { count: number; cheapestPrice: number | null; } | null;
type FlightContextSnapshot = {
  meta: { contextId: string; version: number; hash: string; ts: string; userId: string; };
  user: { plan: 'free' | 'pro'; locale: string; };
  ui: { route: string; searchParams: SearchParams; results: SearchResults; };
};
async function sha256Hex(input: string): Promise<string> { const enc = new TextEncoder().encode(input); const buf = await crypto.subtle.digest('SHA-256', enc); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }

export default function TravelAssistant() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: 'GYE',
    destination: 'MIA',
    departureDate: '2025-11-15',
    returnDate: '2025-11-22',
    passengers: 1,
    nonStopOnly: false,
  });
  const [searchResults, setSearchResults] = useState<SearchResults>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [inspectId, setInspectId] = useState<string>('');
  
  const [displayJson, setDisplayJson] = useState<object | null>(null);
  const [jsonTitle, setJsonTitle] = useState('Waiting for action...');

  const contextId = useMemo(() => crypto.randomUUID(), []);
  const versionRef = useRef(0);
  const buildSnapshot = useCallback(async (): Promise<FlightContextSnapshot> => {
    const base = {
      meta: { contextId, version: versionRef.current, hash: '', ts: new Date().toISOString(), userId: 'u123' },
      user: { plan: 'pro' as const, locale: 'en-US' },
      ui: { route: '/flights/search', searchParams, results: searchResults },
    };
    const hash = await sha256Hex(JSON.stringify(base));
    return { ...base, meta: { ...base.meta, hash } };
  }, [contextId, searchParams, searchResults]);

  const forceSyncContext = async () => {
    const snapshot = await buildSnapshot();
    const res = await fetch('http://localhost:3001/api/context/mirror', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(snapshot) });
    if (res.ok) {
      const { version } = await res.json();
      versionRef.current = version;
      setInspectId(contextId);
      alert(`Context synced to version ${version}`);
    } else {
      const errorData = await res.json();
      alert(`Error: ${res.statusText} - ${JSON.stringify(errorData)}`);
    }
  };

  const inspectContext = async (id: string) => {
    setJsonTitle(`Inspecting Context: ${id.substring(0, 8)}...`);
    setDisplayJson({ status: 'Loading...' });
    const res = await fetch(`http://localhost:3001/api/context/${id}`);
    const data = await res.json();
    setDisplayJson(data);
  };

  const inspectAllContexts = async (id: string) => {
    setJsonTitle('Full Server Context');
    setDisplayJson({ status: 'Loading...' });
    const res = await fetch(`http://localhost:3001/api/context/all/${id}`);
    const data = await res.json();
    setDisplayJson(data);
  };

  const askIA = async () => {
    if (!chatInput) return;
    setJsonTitle('AI Response');
    setDisplayJson({ status: 'Sending question to the AI...' });
    const res = await fetch('http://localhost:3001/api/ia/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: chatInput, contextId }) });
    const data = await res.json();
    setDisplayJson(data);
    setChatInput('');
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-4 text-gray-900">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Section 1: Search Parameters --- */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>1. Search Parameters</CardTitle>
            <CardDescription>Set the baseline values for the flight simulation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="origin">Origin</Label>
                <Input
                    id="origin"
                    value={searchParams.origin}
                    onChange={e => setSearchParams(p => ({ ...p, origin: e.target.value }))}
                    placeholder="E.g.: GYE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={searchParams.destination}
                    onChange={e => setSearchParams(p => ({ ...p, destination: e.target.value }))}
                    placeholder="E.g.: MIA"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">Departure</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={searchParams.departureDate}
                    onChange={e => setSearchParams(p => ({ ...p, departureDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={searchParams.returnDate}
                    onChange={e => setSearchParams(p => ({ ...p, returnDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="passengers">Passengers</Label>
                <Input
                  id="passengers"
                  type="number"
                  min={1}
                  value={searchParams.passengers}
                  onChange={e => setSearchParams(p => ({ ...p, passengers: parseInt(e.target.value, 10) || 1 }))}
                />
              </div>

              <div className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  id="nonStop"
                  checked={searchParams.nonStopOnly}
                  onCheckedChange={checked => setSearchParams(p => ({ ...p, nonStopOnly: checked === true }))}
                />
                <div className="space-y-1">
                  <Label htmlFor="nonStop" className="font-medium">
                    Non-stop flights only
                  </Label>
                  <p className="text-xs text-muted-foreground">Limit the search to direct routes.</p>
                </div>
              </div>
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Travel Assistant</CardTitle>
            <CardDescription>Ask the AI a context-aware question.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="E.g.: Is there anything cheaper?"
                onKeyDown={e => e.key === 'Enter' && askIA()}
              />
              <Button onClick={askIA} className="sm:w-auto" type="button">
                Ask
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Actions & Debugging</CardTitle>
            <CardDescription>Sync and validate the current state on the server.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button onClick={forceSyncContext} className="w-full">Sync Current Context</Button>
            <Button onClick={() => inspectContext(contextId)} className="w-full" variant="secondary">
              Inspect Current Context
            </Button>
            <Button onClick={() => inspectAllContexts(contextId)} className="w-full" variant="outline">
              Inspect Entire Context
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col lg:col-span-2">
          <CardHeader>
            <CardTitle>{jsonTitle}</CardTitle>
            <CardDescription>Serialized data from the mirror and the AI.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[420px] min-h-[240px] overflow-x-auto overflow-y-auto rounded-md bg-secondary p-4 text-xs text-secondary-foreground">
              {displayJson ? JSON.stringify(displayJson, null, 2) : 'No data to show yet.'}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
