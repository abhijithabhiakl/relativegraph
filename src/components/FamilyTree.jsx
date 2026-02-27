import { useCallback, useMemo, useRef } from 'react';
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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 90;
const H_GAP = 60;
const V_GAP = 120;

const nodeTypes = { personNode: PersonNode };

// ─── Layout algorithm ───────────────────────────────────────────────────────
// Assigns each person a "generation" level based on parent depth, then spaces
// them horizontally within each generation.
function buildLayout(people, searchQuery, selectedId) {
    if (!people.length) return { nodes: [], edges: [] };

    const personMap = {};
    people.forEach((p) => (personMap[p.id] = p));

    // Compute generation (depth from root)
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

    // Group by generation
    const byGen = {};
    people.forEach((p) => {
        const g = genCache[p.id] || 0;
        if (!byGen[g]) byGen[g] = [];
        byGen[g].push(p);
    });

    // Sort within generation: by birth year
    Object.values(byGen).forEach((arr) => {
        arr.sort((a, b) => (a.birthYear || 0) - (b.birthYear || 0));
    });

    const isSearching = searchQuery.trim().length > 0;
    const lowerQ = searchQuery.toLowerCase();

    const nodes = [];
    const xPosMap = {};

    const generations = Object.keys(byGen).map(Number).sort((a, b) => a - b);
    generations.forEach((gen) => {
        const group = byGen[gen];
        const totalW = group.length * NODE_WIDTH + (group.length - 1) * H_GAP;
        const startX = -totalW / 2;
        group.forEach((p, i) => {
            const x = startX + i * (NODE_WIDTH + H_GAP);
            const y = gen * (NODE_HEIGHT + V_GAP);
            xPosMap[p.id] = { x, y };

            const fullName = `${p.firstName} ${p.lastName} ${p.nickname || ''}`.toLowerCase();
            const isHighlighted = isSearching && fullName.includes(lowerQ);

            nodes.push({
                id: p.id,
                type: 'personNode',
                position: { x, y },
                data: {
                    person: p,
                    generation: gen,
                    onSelect: () => { },   // patched in FamilyTree below
                    isSelected: p.id === selectedId,
                    isHighlighted,
                    isSearching,
                },
            });
        });
    });

    // ─── Edges ────────────────────────────────────────────────────────────────
    const edges = [];
    const addedEdgePairs = new Set();

    people.forEach((p) => {
        // Parent → child edges
        (p.parentIds || []).forEach((pid) => {
            if (!personMap[pid]) return;
            const edgeId = `pc-${pid}-${p.id}`;
            if (!addedEdgePairs.has(edgeId)) {
                addedEdgePairs.add(edgeId);
                edges.push({
                    id: edgeId,
                    source: pid,
                    target: p.id,
                    type: 'default', // Bezier curve
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#666' },
                    style: { stroke: '#444', strokeWidth: 1.2 },
                    animated: false,
                });
            }
        });

        // Spouse edges (dashed)
        (p.spouseIds || []).forEach((sid) => {
            if (!personMap[sid]) return;
            const key = [p.id, sid].sort().join('--');
            if (!addedEdgePairs.has(key)) {
                addedEdgePairs.add(key);
                edges.push({
                    id: `sp-${key}`,
                    source: p.id,
                    target: sid,
                    type: 'default', // Bezier curve
                    style: {
                        stroke: '#a78bfa',
                        strokeWidth: 1.2,
                        strokeDasharray: '5,5',
                    },
                    label: '♥',
                    labelStyle: { fill: '#a78bfa', fontSize: 12 },
                    labelBgStyle: { fill: 'transparent' },
                });
            }
        });
    });

    return { nodes, edges };
}

export default function FamilyTree({
    searchQuery,
    selectedId,
    onSelectPerson,
}) {
    const { people } = useFamily();

    const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
        () => buildLayout(people, searchQuery, selectedId),
        [people, searchQuery, selectedId]
    );

    // Patch in the onSelect callback (can't do it inside useMemo without closure issues)
    const patchedNodes = useMemo(
        () =>
            layoutNodes.map((n) => ({
                ...n,
                data: { ...n.data, onSelect: onSelectPerson },
            })),
        [layoutNodes, onSelectPerson]
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(patchedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

    // Sync external changes into React Flow state
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
                fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
                minZoom={0.1}
                maxZoom={2.5}
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
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
