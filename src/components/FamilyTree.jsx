import { useMemo } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamily } from '../store/familyStore';
import PersonNode from './PersonNode';

// ─── Layout constants ────────────────────────────────────────────────────────
// Left-to-right: generation drives the X column, index within generation drives Y row
const NODE_W = 180;
const NODE_H = 90;
const COL_GAP = 90;   // horizontal gap between generation columns
const ROW_GAP = 44;   // vertical gap between nodes in the same column

const nodeTypes = { personNode: PersonNode };

// ─── Layout algorithm (left → right) ────────────────────────────────────────
function buildLayout(people, searchQuery, selectedId) {
    if (!people.length) return { nodes: [], edges: [] };

    const personMap = {};
    people.forEach((p) => (personMap[p.id] = p));

    // ── 1. Compute generation depth (0 = root / no known parents) ─────────
    const genCache = {};
    function getGen(id, visited = new Set()) {
        if (genCache[id] !== undefined) return genCache[id];
        if (visited.has(id)) return 0;
        visited.add(id);
        const p = personMap[id];
        if (!p || !p.parentIds || p.parentIds.length === 0) {
            genCache[id] = 0;
            return 0;
        }
        const parentGens = p.parentIds
            .filter((pid) => personMap[pid])
            .map((pid) => getGen(pid, new Set(visited)));
        const g = parentGens.length ? Math.max(...parentGens) + 1 : 0;
        genCache[id] = g;
        return g;
    }
    people.forEach((p) => getGen(p.id));

    // ── 2. Detect & re-assign "outsider" spouses ───────────────────────────
    // An outsider is someone with NO parents in this tree who is married to
    // someone who DOES have parents. We pull them into their spouse's generation
    // so they appear adjacent in the same column rather than stranded in gen 0.
    people.forEach((p) => {
        const hasNoParents = !p.parentIds || p.parentIds.every((pid) => !personMap[pid]);
        if (!hasNoParents) return; // skip people with known parents
        const treeSpouses = (p.spouseIds || []).filter((sid) => {
            const s = personMap[sid];
            return s && s.parentIds && s.parentIds.some((pid) => personMap[pid]);
        });
        if (treeSpouses.length > 0) {
            genCache[p.id] = genCache[treeSpouses[0]]; // same column as their spouse
        }
    });

    // ── 3. Group by generation ─────────────────────────────────────────────
    const byGen = {};
    people.forEach((p) => {
        const g = genCache[p.id] || 0;
        if (!byGen[g]) byGen[g] = [];
        byGen[g].push(p);
    });

    // ── 4. Order within each generation: group children with parents ───────
    const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);

    generations.forEach((gen, index) => {
        const arr = byGen[gen];
        const ordered = [];
        const seen = new Set();

        const addPersonAndSpouses = (p) => {
            if (seen.has(p.id)) return;
            ordered.push(p);
            seen.add(p.id);
            // Immediately follow with each spouse found in the same generation
            (p.spouseIds || []).forEach((sid) => {
                if (!seen.has(sid)) {
                    const spouse = arr.find((s) => s.id === sid);
                    if (spouse) {
                        ordered.push(spouse);
                        seen.add(sid);
                    }
                }
            });
        };

        if (index === 0) {
            // Root generation: purely by birth year
            arr.sort((a, b) => (a.birthYear || 0) - (b.birthYear || 0));
            arr.forEach(addPersonAndSpouses);
        } else {
            // Subsequent generations: follow the order of the previous generation's parents
            const prevGen = generations[index - 1];
            const prevOrdered = byGen[prevGen];

            prevOrdered.forEach((parent) => {
                // Find children of this parent who are in the current generation
                const childrenInGen = arr.filter(
                    (p) => !seen.has(p.id) && (p.parentIds || []).includes(parent.id)
                );
                // Sort siblings by birth year
                childrenInGen.sort((a, b) => (a.birthYear || 0) - (b.birthYear || 0));
                childrenInGen.forEach(addPersonAndSpouses);
            });

            // Catch any remaining people (e.g., parents in older generations)
            const remaining = arr.filter((p) => !seen.has(p.id));
            remaining.sort((a, b) => (a.birthYear || 0) - (b.birthYear || 0));
            remaining.forEach(addPersonAndSpouses);
        }

        byGen[gen] = ordered;
    });

    // ── 5. Position nodes: X = generation column, Y = index within column ──
    const isSearching = searchQuery.trim().length > 0;
    const lowerQ = searchQuery.toLowerCase();

    const nodes = [];
    const posMap = {}; // id → { x, y }

    generations.forEach((gen) => {
        const group = byGen[gen];
        const totalH = group.length * NODE_H + (group.length - 1) * ROW_GAP;
        const startY = -totalH / 2;
        const x = gen * (NODE_W + COL_GAP);

        group.forEach((p, i) => {
            const y = startY + i * (NODE_H + ROW_GAP);
            posMap[p.id] = { x, y };

            const fullName = `${p.firstName} ${p.lastName} ${p.nickname || ''}`.toLowerCase();
            const isHighlighted = isSearching && fullName.includes(lowerQ);

            nodes.push({
                id: p.id,
                type: 'personNode',
                position: { x, y },
                data: {
                    person: p,
                    generation: gen,
                    onSelect: () => { },  // patched below
                    isSelected: p.id === selectedId,
                    isHighlighted,
                    isSearching,
                },
            });
        });
    });

    // ── 6. Build edges ─────────────────────────────────────────────────────
    const edges = [];
    const addedEdgePairs = new Set();

    // Build related-ID set: selected node + their parents + parents' spouses.
    // Any edge where BOTH endpoints fall in this set (or one is selectedId) is highlighted.
    const selectedPerson = selectedId ? personMap[selectedId] : null;
    const selectedParentIds = new Set(
        selectedPerson ? (selectedPerson.parentIds || []).filter((pid) => personMap[pid]) : []
    );
    // Also collect spouses of those parents so the parent-spouse edge highlights
    const selectedRelatedIds = new Set([...(selectedId ? [selectedId] : []), ...selectedParentIds]);
    selectedParentIds.forEach((pid) => {
        const parent = personMap[pid];
        if (parent) (parent.spouseIds || []).forEach((sid) => selectedRelatedIds.add(sid));
    });
    // Add direct spouses of selected node too
    if (selectedPerson) {
        (selectedPerson.spouseIds || []).forEach((sid) => selectedRelatedIds.add(sid));
    }

    people.forEach((p) => {
        // Parent → child: smoothstep curves from right-handle to left-handle
        // Only the primary parent to avoid spaghetti; secondary parent edge still
        // drawn (lighter) so children are always anchored.
        const validParents = (p.parentIds || []).filter((pid) => personMap[pid]);

        validParents.forEach((parentId, idx) => {
            const edgeId = `pc-${parentId}-${p.id}`;
            if (addedEdgePairs.has(edgeId)) return;
            addedEdgePairs.add(edgeId);

            const isPrimary = idx === 0;
            // Incident: edge touches selected node OR one of its parents (so parent→sibling
            // edge doesn't highlight, but parent→selected does)
            const isIncident = selectedId && (parentId === selectedId || p.id === selectedId);
            const isDimmed = selectedId && !isIncident;
            // Highlighted edges always above dimmed
            const edgeZIndex = isIncident ? 50 : (isDimmed ? 0 : (isPrimary ? 1 : 0));

            edges.push({
                id: edgeId,
                source: parentId,
                target: p.id,
                type: 'default',
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: isDimmed ? '#1a1a1a' : (isIncident ? '#fff' : (isPrimary ? '#666' : '#444')),
                    width: 14,
                    height: 14,
                },
                style: {
                    stroke: isIncident ? '#e2e8f0' : (isDimmed ? '#161616' : (isPrimary ? '#4a4a6a' : '#333')),
                    strokeWidth: isIncident ? 2.8 : (isPrimary ? 1.4 : 1),
                    opacity: isIncident ? 1 : (isPrimary ? 1 : 0.25),
                    transition: 'all 0.25s ease',
                },
                animated: isIncident,
                zIndex: edgeZIndex,
            });
        });

        // Spouse edges: straight dashed line between adjacent nodes in same column
        (p.spouseIds || []).forEach((sid) => {
            if (!personMap[sid]) return;
            const key = [p.id, sid].sort().join('--');
            if (addedEdgePairs.has(key)) return;
            addedEdgePairs.add(key);

            // Incident: either endpoint is in the selectedRelatedIds set
            // This catches: direct spouse of selected, parent-to-parent spouse edge,
            // and spouses of parents (if they married outside this tree)
            const isIncident = selectedId && (selectedRelatedIds.has(p.id) || selectedRelatedIds.has(sid));
            const isDimmed = selectedId && !isIncident;
            const baseColor = '#e4094b';
            const activeColor = '#ff3366';
            const dimColor = '#2a0010';
            // Highlighted spouse edges always above everything
            const spouseZIndex = isIncident ? 60 : (isDimmed ? 0 : 5);

            edges.push({
                id: `sp-${key}`,
                source: p.id,
                target: sid,
                type: 'default',
                style: {
                    stroke: isIncident ? activeColor : (isDimmed ? dimColor : baseColor),
                    strokeWidth: isIncident ? 3 : 1.5,
                    strokeDasharray: '5,4',
                    transition: 'all 0.25s ease',
                    filter: isIncident ? 'drop-shadow(0 0 4px rgba(255,51,102,0.6))' : 'none',
                },
                label: '♥',
                labelStyle: {
                    fill: isIncident ? activeColor : (isDimmed ? dimColor : baseColor),
                    fontSize: isIncident ? 15 : 11,
                    transition: 'all 0.25s ease',
                },
                labelBgStyle: { fill: 'transparent' },
                animated: isIncident,
                zIndex: spouseZIndex,
            });
        });
    });

    return { nodes, edges };
}

export default function FamilyTree({ searchQuery, selectedId, onSelectPerson }) {
    const { people } = useFamily();

    const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
        () => buildLayout(people, searchQuery, selectedId),
        [people, searchQuery, selectedId]
    );

    // Patch onSelect callback into each node (avoids re-running the layout)
    const patchedNodes = useMemo(
        () => layoutNodes.map((n) => ({
            ...n,
            data: { ...n.data, onSelect: onSelectPerson },
        })),
        [layoutNodes, onSelectPerson]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(patchedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

    // Keep React Flow state in sync with layout recomputes
    useMemo(() => {
        setNodes(patchedNodes);
        setEdges(layoutEdges);
    }, [patchedNodes, layoutEdges]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{
                    padding: 0.04,
                    minZoom: window.innerWidth < 640 ? 0.7 : 0.5,
                    maxZoom: 0.95,
                }}
                minZoom={0.08}
                maxZoom={2.5}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
                onPaneClick={() => onSelectPerson(null)}
            >
                <Background color="#222" gap={28} size={1} />
                <Controls
                    style={{
                        background: '#1a1a2e',
                        border: '1px solid #333',
                        borderRadius: '10px',
                    }}
                />
                <MiniMap
                    nodeColor="#8b5cf6"
                    style={{
                        background: '#0d0d1a',
                        border: '1px solid #333',
                        borderRadius: '10px',
                    }}
                    maskColor="rgba(0,0,0,0.6)"
                />
            </ReactFlow>
        </div>
    );
}
