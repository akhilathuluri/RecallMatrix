'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconWrapper } from '@/components/ui/icon-wrapper';
import { GradientText } from '@/components/ui/gradient-text';
import { Network, Loader2, FileText, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2, Info, Calendar } from 'lucide-react';
import { supabase, Memory } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type KnowledgeGraphProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
};

type GraphNode = {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'file';
  connections: number;
  cluster: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  created_at: string;
  index_position: number;
};

type GraphConnection = {
  from: string;
  to: string;
  strength: number;
  label: string;
};

export function KnowledgeGraph({ open, onOpenChange, userId }: KnowledgeGraphProps) {
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [connections, setConnections] = useState<GraphConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showConnectionLabels, setShowConnectionLabels] = useState(false);
  const [stats, setStats] = useState({ totalNodes: 0, totalConnections: 0, clusters: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isDraggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const calculateSimilarity = async (mem1: Memory, mem2: Memory): Promise<{ similarity: number; reason: string }> => {
    // Use actual vector embeddings for semantic similarity
    try {
      // Check if embeddings exist and are valid arrays
      const hasValidEmbedding1 = mem1.embedding && Array.isArray(mem1.embedding) && mem1.embedding.length > 0;
      const hasValidEmbedding2 = mem2.embedding && Array.isArray(mem2.embedding) && mem2.embedding.length > 0;

      if (!hasValidEmbedding1 || !hasValidEmbedding2) {
        console.log(`Missing embeddings for "${mem1.title}" or "${mem2.title}", using keyword fallback`);
        
        // Fallback: use keyword similarity if embeddings not available
        const text1 = (mem1.title + ' ' + (mem1.content || '')).toLowerCase();
        const text2 = (mem2.title + ' ' + (mem2.content || '')).toLowerCase();
        
        // Common stop words to filter out (not semantically meaningful)
        const stopWords = new Set([
          // Possessives & pronouns
          'my', 'me', 'i', 'mine', 'our', 'ours', 'your', 'yours', 'their', 'theirs',
          'this', 'that', 'these', 'those', 'the', 'a', 'an',
          // Common media types
          'image', 'img', 'photo', 'picture', 'pic', 'file', 'document', 'doc',
          // Common verbs
          'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had',
          // Others
          'and', 'or', 'but', 'for', 'with', 'from', 'about'
        ]);
        
        // Dynamic semantic keyword groups - universal concepts that indicate relationships
        const semanticGroups = [
          // Temporal/celebration
          ['birthday', 'born', 'birth', 'bday', 'anniversary', 'celebration', 'age'],
          // Relationships
          ['love', 'lover', 'loved', 'loving', 'relationship', 'partner', 'together'],
          ['friend', 'friendship', 'buddy', 'pal', 'companion'],
          ['family', 'mother', 'father', 'sister', 'brother', 'parent', 'sibling'],
          ['girlfriend', 'boyfriend', 'wife', 'husband', 'spouse'],
          // Work/professional
          ['work', 'job', 'career', 'office', 'project', 'task', 'meeting'],
          ['design', 'ui', 'ux', 'interface', 'visual', 'graphic', 'layout'],
          ['code', 'coding', 'programming', 'development', 'software', 'app'],
          // Activities
          ['travel', 'trip', 'vacation', 'journey', 'tour', 'visit'],
          ['food', 'restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'eating'],
          ['movie', 'film', 'cinema', 'show', 'series', 'watch', 'watched'],
          ['music', 'song', 'concert', 'band', 'listen', 'listening'],
          // Emotions
          ['happy', 'happiness', 'joy', 'joyful', 'excited', 'excitement'],
          ['sad', 'sadness', 'unhappy', 'disappointed', 'disappointment'],
          // Learning
          ['learn', 'learning', 'study', 'studying', 'education', 'course', 'class'],
          ['book', 'read', 'reading', 'novel', 'article'],
        ];
        
        // Extract meaningful words, excluding stop words
        const words1 = text1.split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w));
        const words2 = text2.split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w));
        
        if (words1.length === 0 || words2.length === 0) {
          return { similarity: 0, reason: 'No content' };
        }
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        // Detect proper nouns (capitalized words in original text) - likely person/place names
        const detectProperNouns = (text: string): Set<string> => {
          const properNouns = new Set<string>();
          // Match capitalized words that aren't at sentence start
          const matches = text.match(/(?<=[.!?]\s+|^|\s)[A-Z][a-z]{2,}/g) || [];
          matches.forEach(word => {
            const lower = word.toLowerCase();
            // Skip if it's a common word or stop word
            if (!stopWords.has(lower) && lower.length > 2) {
              properNouns.add(lower);
            }
          });
          return properNouns;
        };
        
        // Get proper nouns from original (not lowercased) text
        const properNouns1 = detectProperNouns(mem1.title + ' ' + (mem1.content || ''));
        const properNouns2 = detectProperNouns(mem2.title + ' ' + (mem2.content || ''));
        
        // Find exact matches (including proper nouns get higher weight)
        const exactMatches = words1.filter(w => set2.has(w));
        const properNounMatches = exactMatches.filter(w => 
          properNouns1.has(w) && properNouns2.has(w)
        );
        
        // Find semantic matches (words from same group)
        const semanticMatches: string[] = [];
        const semanticWeights: number[] = [];
        
        for (const group of semanticGroups) {
          const words1InGroup = words1.filter(w => group.some(g => w.includes(g) || g.includes(w)));
          const words2InGroup = words2.filter(w => group.some(g => w.includes(g) || g.includes(w)));
          
          if (words1InGroup.length > 0 && words2InGroup.length > 0) {
            semanticMatches.push(group[0]); // Use the primary word from the group
            // Weight based on number of matches in the group
            const weight = Math.min(words1InGroup.length, words2InGroup.length) * 0.9;
            semanticWeights.push(weight);
          }
        }
        
        // Calculate similarity
        const exactMatchScore = exactMatches.length;
        const properNounScore = properNounMatches.length * 0.5; // Extra weight for matching names/places
        const semanticMatchScore = semanticWeights.reduce((sum, weight) => sum + weight, 0);
        const totalScore = exactMatchScore + properNounScore + semanticMatchScore;
        const avgLength = (words1.length + words2.length) / 2;
        let sim = totalScore / Math.max(avgLength, 3); // Use at least 3 to avoid over-weighting very short texts
        
        // Boost for texts with strong semantic overlap
        if (semanticMatches.length >= 2) {
          sim = Math.min(1, sim * 1.4); // Multiple semantic themes
        } else if (semanticMatches.length === 1 && semanticWeights[0] >= 1) {
          sim = Math.min(1, sim * 1.3); // Strong single semantic theme
        }
        
        // Boost for proper noun matches (people/places)
        if (properNounMatches.length >= 2) {
          sim = Math.min(1, sim * 1.3); // Multiple shared entities
        } else if (properNounMatches.length === 1) {
          sim = Math.min(1, sim * 1.2); // Single shared entity
        }
        
        // Boost for very short texts with good matches
        if (avgLength < 8 && (exactMatches.length > 0 || semanticMatches.length > 0)) {
          sim = Math.min(1, sim * 1.2);
        }
        
        // Build detailed reason string
        const matchParts: string[] = [];
        if (exactMatches.length > 0) {
          const topExact = exactMatches.slice(0, 3).join(', ');
          matchParts.push(`exact: ${topExact}`);
        }
        if (properNounMatches.length > 0) {
          const topNames = properNounMatches.slice(0, 3).join(', ');
          matchParts.push(`names: ${topNames}`);
        }
        if (semanticMatches.length > 0) {
          const topSemantic = semanticMatches.slice(0, 3).join(', ');
          matchParts.push(`themes: ${topSemantic}`);
        }
        
        return { 
          similarity: Math.min(1, sim),
          reason: matchParts.length > 0 ? matchParts.join(' | ') : 'No significant matches'
        };
      }

      const embedding1 = mem1.embedding as number[];
      const embedding2 = mem2.embedding as number[];

      // Verify embeddings have the same length
      if (embedding1.length !== embedding2.length) {
        console.error(`Embedding length mismatch: ${embedding1.length} vs ${embedding2.length}`);
        return { similarity: 0, reason: 'Invalid embeddings' };
      }

      // Calculate cosine similarity
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        const val1 = embedding1[i];
        const val2 = embedding2[i];
        
        // Check for NaN or invalid values
        if (isNaN(val1) || isNaN(val2)) {
          console.error(`Invalid embedding values at index ${i}`);
          return { similarity: 0, reason: 'Invalid embedding values' };
        }
        
        dotProduct += val1 * val2;
        magnitude1 += val1 * val1;
        magnitude2 += val2 * val2;
      }

      magnitude1 = Math.sqrt(magnitude1);
      magnitude2 = Math.sqrt(magnitude2);

      if (magnitude1 === 0 || magnitude2 === 0 || isNaN(magnitude1) || isNaN(magnitude2)) {
        console.error('Invalid magnitude values:', { magnitude1, magnitude2 });
        return { similarity: 0, reason: 'Zero magnitude' };
      }

      const similarity = dotProduct / (magnitude1 * magnitude2);
      
      // Check if similarity is NaN
      if (isNaN(similarity)) {
        console.error('Similarity calculation resulted in NaN', { 
          dotProduct, 
          magnitude1, 
          magnitude2 
        });
        return { similarity: 0, reason: 'Calculation error' };
      }
      
      // Convert from [-1, 1] to [0, 1] range
      const normalizedSim = Math.max(0, Math.min(1, (similarity + 1) / 2));
      
      // Generate semantic label based on similarity strength
      let reason = '';
      if (normalizedSim > 0.8) reason = 'Very similar topics';
      else if (normalizedSim > 0.65) reason = 'Related concepts';
      else if (normalizedSim > 0.5) reason = 'Similar themes';
      else reason = 'Weakly connected';
      
      return { similarity: normalizedSim, reason };
    } catch (error) {
      console.error('Error calculating similarity:', error);
      return { similarity: 0, reason: 'Error' };
    }
  };

  // Cluster detection using simple community detection
  const detectClusters = (graphNodes: GraphNode[], graphConnections: GraphConnection[]): number => {
    const clusters: number[] = new Array(graphNodes.length).fill(-1);
    let currentCluster = 0;

    // Build adjacency map for faster lookups
    const adjacencyMap = new Map<string, Set<string>>();
    
    graphNodes.forEach(node => {
      adjacencyMap.set(node.id, new Set());
    });
    
    graphConnections.forEach(conn => {
      // Ensure both nodes exist in the map
      if (adjacencyMap.has(conn.from) && adjacencyMap.has(conn.to)) {
        adjacencyMap.get(conn.from)!.add(conn.to);
        adjacencyMap.get(conn.to)!.add(conn.from);
      } else {
        console.error('Connection references non-existent node:', conn);
      }
    });

    const assignCluster = (nodeIndex: number, clusterId: number, visited: Set<number> = new Set()) => {
      if (clusters[nodeIndex] !== -1 || visited.has(nodeIndex)) return;
      
      clusters[nodeIndex] = clusterId;
      visited.add(nodeIndex);

      const nodeId = graphNodes[nodeIndex].id;
      const connectedIds = adjacencyMap.get(nodeId);
      
      if (!connectedIds) {
        console.error(`No adjacency entry for node ${nodeId}`);
        return;
      }
      
      connectedIds.forEach(connId => {
        const connIndex = graphNodes.findIndex(n => n.id === connId);
        if (connIndex !== -1 && clusters[connIndex] === -1) {
          assignCluster(connIndex, clusterId, visited);
        }
      });
    };

    // Assign clusters using DFS
    for (let i = 0; i < graphNodes.length; i++) {
      if (clusters[i] === -1) {
        assignCluster(i, currentCluster);
        currentCluster++;
      }
    }

    // Update node cluster assignments
    graphNodes.forEach((node, idx) => {
      node.cluster = clusters[idx];
    });

    console.log('Cluster assignments:', graphNodes.map(n => `${n.title} -> Cluster ${n.cluster}`));

    return currentCluster;
  };

  const getClusterColor = (cluster: number): string => {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#06b6d4', // cyan
      '#f97316', // orange
      '#6366f1', // indigo
    ];
    return colors[cluster % colors.length];
  };

  const startSimulation = (graphNodes: GraphNode[], graphConnections: GraphConnection[]) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }

    console.log('Starting simulation with', graphNodes.length, 'nodes and', graphConnections.length, 'connections');

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let iterationCount = 0;
    const maxIterations = 300; // Stabilize after 300 frames

    const simulate = () => {
      iterationCount++;
      const stabilized = iterationCount > maxIterations;

      // Physics simulation - Force-directed graph
      const nodes = [...graphNodes];

      if (!stabilized) {
        // Apply forces only until stabilized
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          
          // Center gravity (pull nodes toward center)
          const dx = centerX - (node.x + centerX);
          const dy = centerY - (node.y + centerY);
          const distToCenter = Math.sqrt(dx * dx + dy * dy);
          if (distToCenter > 0) {
            node.vx += (dx / distToCenter) * 0.02;
            node.vy += (dy / distToCenter) * 0.02;
          }

          // Repulsion between nodes (charge force)
          for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            const other = nodes[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 800 / (dist * dist); // Stronger repulsion
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }

          // Attraction along connections (spring force)
          graphConnections.forEach(conn => {
            if (conn.from === node.id) {
              const target = nodes.find(n => n.id === conn.to);
              if (target) {
                const dx = target.x - node.x;
                const dy = target.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist * 0.002) * conn.strength;
                node.vx += (dx / dist) * force;
                node.vy += (dy / dist) * force;
              }
            }
            if (conn.to === node.id) {
              const target = nodes.find(n => n.id === conn.from);
              if (target) {
                const dx = target.x - node.x;
                const dy = target.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist * 0.002) * conn.strength;
                node.vx += (dx / dist) * force;
                node.vy += (dy / dist) * force;
              }
            }
          });

          // Apply velocity with damping
          node.vx *= 0.88;
          node.vy *= 0.88;
          
          // Skip dragged node
          if (isDraggingRef.current !== node.id) {
            node.x += node.vx;
            node.y += node.vy;
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);

      // Draw cluster backgrounds
      const clusterPositions = new Map<number, { x: number; y: number; count: number }>();
      nodes.forEach(node => {
        if (!clusterPositions.has(node.cluster)) {
          clusterPositions.set(node.cluster, { x: 0, y: 0, count: 0 });
        }
        const cluster = clusterPositions.get(node.cluster)!;
        cluster.x += node.x;
        cluster.y += node.y;
        cluster.count += 1;
      });

      clusterPositions.forEach((cluster, clusterNum) => {
        const avgX = cluster.x / cluster.count;
        const avgY = cluster.y / cluster.count;
        const radius = Math.max(80, cluster.count * 30);
        
        ctx.beginPath();
        ctx.arc(avgX, avgY, radius, 0, Math.PI * 2);
        const clusterColor = getClusterColor(clusterNum);
        const gradient = ctx.createRadialGradient(avgX, avgY, 0, avgX, avgY, radius);
        gradient.addColorStop(0, `${clusterColor}15`);
        gradient.addColorStop(1, `${clusterColor}05`);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = `${clusterColor}30`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw connections with labels
      graphConnections.forEach(conn => {
        const from = nodes.find(n => n.id === conn.from);
        const to = nodes.find(n => n.id === conn.to);
        
        if (!from || !to) {
          console.error(`Connection error: Cannot find nodes for connection`, { 
            fromId: conn.from, 
            toId: conn.to,
            fromFound: !!from,
            toFound: !!to
          });
          return;
        }
        
        const isHighlighted = 
          (selectedNode?.id === from.id || selectedNode?.id === to.id) ||
          (hoveredNode?.id === from.id || hoveredNode?.id === to.id);
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        
        // Color based on connection strength
        const opacity = isHighlighted ? 0.9 : conn.strength * 0.6;
        const lineWidth = isHighlighted ? 3 : conn.strength * 2.5;
        
        if (conn.strength > 0.7) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`; // Strong: green
        } else if (conn.strength > 0.5) {
          ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`; // Medium: blue
        } else {
          ctx.strokeStyle = `rgba(156, 163, 175, ${opacity})`; // Weak: gray
        }
        
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Draw connection label if enabled and zoomed in
        if (showConnectionLabels && zoom > 0.8 && isHighlighted && conn.label) {
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          
          ctx.font = 'bold 10px sans-serif';
          const textWidth = ctx.measureText(conn.label).width;
          
          // Background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 16);
          
          // Border
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 16);
          
          // Text
          ctx.fillStyle = '#1f2937';
          ctx.textAlign = 'center';
          ctx.fillText(conn.label, midX, midY + 2);
        }

        // Debug: Draw connection endpoints (remove after testing)
        if (process.env.NODE_ENV === 'development' && isHighlighted) {
          // Draw small circles at connection endpoints to verify correct nodes
          ctx.beginPath();
          ctx.arc(from.x, from.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'red';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(to.x, to.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'blue';
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode?.id === node.id;
        const isHighlighted = isSelected || isHovered;
        
        const baseRadius = 12;
        const connectionBonus = Math.min(node.connections * 4, 20);
        const radius = baseRadius + connectionBonus;
        const displayRadius = isHighlighted ? radius * 1.2 : radius;
        
        const clusterColor = getClusterColor(node.cluster);

        // Node glow effect
        if (isHighlighted) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, displayRadius + 8, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, displayRadius + 8);
          gradient.addColorStop(0, `${clusterColor}50`);
          gradient.addColorStop(1, `${clusterColor}00`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Node shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, displayRadius, 0, Math.PI * 2);
        ctx.fillStyle = clusterColor;
        ctx.fill();
        
        // Node border
        ctx.strokeStyle = isHighlighted ? '#fff' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = isHighlighted ? 3 : 2;
        ctx.stroke();
        
        ctx.shadowColor = 'transparent';

        // Node type icon
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.type === 'text' ? '📝' : '📁', node.x, node.y + 5);

        // Connection count badge
        if (node.connections > 0) {
          const badgeX = node.x + displayRadius - 6;
          const badgeY = node.y - displayRadius + 6;
          const badgeRadius = 10;
          
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(node.connections.toString(), badgeX, badgeY + 3);
        }

        // Node label (always show for selected/hovered, conditionally for others)
        if (showLabels || isHighlighted) {
          ctx.fillStyle = '#1f2937';
          ctx.font = isHighlighted ? 'bold 13px sans-serif' : 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          const maxLength = isHighlighted ? 30 : 20;
          const label = node.title.length > maxLength 
            ? node.title.slice(0, maxLength) + '...' 
            : node.title;
          
          // Text background for readability
          const textWidth = ctx.measureText(label).width;
          const textHeight = isHighlighted ? 20 : 16;
          const padding = 6;
          
          ctx.fillStyle = isHighlighted 
            ? 'rgba(255, 255, 255, 0.98)' 
            : 'rgba(255, 255, 255, 0.92)';
          ctx.fillRect(
            node.x - textWidth / 2 - padding, 
            node.y + displayRadius + 8, 
            textWidth + padding * 2, 
            textHeight
          );
          
          // Border around label
          if (isHighlighted) {
            ctx.strokeStyle = clusterColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(
              node.x - textWidth / 2 - padding, 
              node.y + displayRadius + 8, 
              textWidth + padding * 2, 
              textHeight
            );
          }
          
          ctx.fillStyle = isHighlighted ? clusterColor : '#1f2937';
          ctx.fillText(label, node.x, node.y + displayRadius + 20);
          
          // Index position below title
          if (isHighlighted) {
            ctx.font = '9px sans-serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(`#${node.index_position}`, node.x, node.y + displayRadius + 34);
          }
        }
      });

      ctx.restore();

      setNodes(nodes);
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();
  };

  useEffect(() => {
    if (open && userId) {
      loadGraphData();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [open, userId]);

  // Separate effect to restart simulation when nodes change
  useEffect(() => {
    if (nodes.length > 0 && connections.length >= 0 && canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      startSimulation(nodes, connections);
    }
  }, [nodes.length, connections.length]);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const { data: memories, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!memories || memories.length === 0) {
        toast.info('No memories found. Add some memories to see the graph!');
        setLoading(false);
        return;
      }

      console.log(`Processing ${memories.length} memories for graph...`);
      
      // Check embedding status
      const memoriesWithEmbeddings = memories.filter((m: Memory) => m.embedding && Array.isArray(m.embedding) && m.embedding.length > 0);
      const memoriesWithoutEmbeddings = memories.filter((m: Memory) => !m.embedding || !Array.isArray(m.embedding) || m.embedding.length === 0);
      
      console.log(`Embeddings status: ${memoriesWithEmbeddings.length} with embeddings, ${memoriesWithoutEmbeddings.length} without`);
      
      if (memoriesWithoutEmbeddings.length > 0) {
        console.warn('Memories without embeddings:', memoriesWithoutEmbeddings.map((m: Memory) => ({
          title: m.title,
          id: m.id,
          hasEmbedding: !!m.embedding,
          embeddingType: typeof m.embedding,
          isArray: Array.isArray(m.embedding)
        })));
        
        toast.warning(`${memoriesWithoutEmbeddings.length} memories are missing embeddings. They may not connect properly.`, {
          duration: 5000
        });
      }

      // Create nodes from memories
      const graphNodes: GraphNode[] = memories.map((mem: Memory, idx: number) => ({
        id: mem.id,
        title: mem.title,
        content: mem.content || '',
        type: mem.type,
        connections: 0,
        cluster: 0,
        x: Math.random() * 600 - 300,
        y: Math.random() * 400 - 200,
        vx: 0,
        vy: 0,
        created_at: mem.created_at,
        index_position: mem.index_position,
      }));

      // Calculate connections based on semantic similarity using vector embeddings
      const graphConnections: GraphConnection[] = [];
      const connectionMap = new Map<string, Set<string>>(); // Track which nodes are connected
      
      // Adjusted threshold - be more selective for clearer connections
      const SIMILARITY_THRESHOLD = memoriesWithEmbeddings.length >= 2 ? 0.50 : 0.25; // Lower threshold if using keyword fallback
      
      console.log('Calculating similarities between memories...');
      
      for (let i = 0; i < memories.length; i++) {
        for (let j = i + 1; j < memories.length; j++) {
          const { similarity, reason } = await calculateSimilarity(memories[i], memories[j]);
          
          // Only log if similarity is a valid number
          if (!isNaN(similarity)) {
            console.log(`Similarity between "${memories[i].title}" and "${memories[j].title}": ${(similarity * 100).toFixed(1)}% (${reason})`);
          } else {
            console.error(`NaN similarity between "${memories[i].title}" and "${memories[j].title}"`);
            continue; // Skip this connection
          }
          
          if (similarity > SIMILARITY_THRESHOLD) {
            // Ensure we're connecting the correct nodes
            const fromId = memories[i].id;
            const toId = memories[j].id;
            
            // Verify both nodes exist
            const fromNode = graphNodes.find(n => n.id === fromId);
            const toNode = graphNodes.find(n => n.id === toId);
            
            if (fromNode && toNode) {
              // Check if connection already exists (avoid duplicates)
              const connectionKey = [fromId, toId].sort().join('-');
              
              if (!connectionMap.has(connectionKey)) {
                connectionMap.set(connectionKey, new Set([fromId, toId]));
                
                graphConnections.push({
                  from: fromId,
                  to: toId,
                  strength: similarity,
                  label: reason,
                });
                
                // Increment connection counts on the actual node objects
                fromNode.connections++;
                toNode.connections++;
                
                console.log(`✓ Connected: "${memories[i].title}" ←→ "${memories[j].title}" (${(similarity * 100).toFixed(1)}%)`);
              }
            } else {
              console.error(`Node not found: fromId=${fromId}, toId=${toId}`);
            }
          }
        }
      }

      // If no connections found, create some based on temporal proximity (created at similar times)
      if (graphConnections.length === 0 && memories.length > 1) {
        console.log('No semantic connections found, creating temporal connections based on creation time...');
        
        // Sort by creation time to connect chronologically close memories
        const sortedMemories = [...memories].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        for (let i = 0; i < Math.min(sortedMemories.length - 1, 5); i++) {
          const fromId = sortedMemories[i].id;
          const toId = sortedMemories[i + 1].id;
          
          const fromNode = graphNodes.find(n => n.id === fromId);
          const toNode = graphNodes.find(n => n.id === toId);
          
          if (fromNode && toNode) {
            graphConnections.push({
              from: fromId,
              to: toId,
              strength: 0.5,
              label: 'Created nearby',
            });
            fromNode.connections++;
            toNode.connections++;
            
            console.log(`✓ Temporal connection: "${fromNode.title}" ←→ "${toNode.title}"`);
          }
        }
      }

      // Detect clusters
      const clusterCount = detectClusters(graphNodes, graphConnections);

      console.log(`✓ Graph created: ${graphNodes.length} nodes, ${graphConnections.length} connections, ${clusterCount} clusters`);
      console.log('Connection breakdown:', graphNodes.map(n => `${n.title}: ${n.connections} connections`));

      setNodes(graphNodes);
      setConnections(graphConnections);
      setStats({
        totalNodes: graphNodes.length,
        totalConnections: graphConnections.length,
        clusters: clusterCount,
      });
      
      // Don't start simulation here - let the useEffect handle it when canvas is ready
    } catch (error: any) {
      toast.error('Failed to load knowledge graph');
      console.error('Graph loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - canvas.width / 2) / zoom);
    const y = ((e.clientY - rect.top - canvas.height / 2) / zoom);

    const clicked = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const baseRadius = 12;
      const connectionBonus = Math.min(node.connections * 4, 20);
      const radius = baseRadius + connectionBonus;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });

    if (clicked) {
      setSelectedNode(clicked);
      isDraggingRef.current = clicked.id;
      dragOffsetRef.current = { x: clicked.x - x, y: clicked.y - y };
    } else {
      setSelectedNode(null);
      isDraggingRef.current = null;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left - canvas.width / 2) / zoom);
    const y = ((e.clientY - rect.top - canvas.height / 2) / zoom);

    // Update dragged node position
    if (isDraggingRef.current) {
      const node = nodes.find(n => n.id === isDraggingRef.current);
      if (node) {
        node.x = x + dragOffsetRef.current.x;
        node.y = y + dragOffsetRef.current.y;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    // Check for hover
    const hovered = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const baseRadius = 12;
      const connectionBonus = Math.min(node.connections * 4, 20);
      const radius = baseRadius + connectionBonus;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    });

    setHoveredNode(hovered || null);
  };

  const handleCanvasMouseUp = () => {
    isDraggingRef.current = null;
  };

  const handleCanvasMouseLeave = () => {
    setHoveredNode(null);
    isDraggingRef.current = null;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[90vw] md:max-w-[1100px] h-[85vh] sm:h-[90vh] glass-card border shadow-2xl rounded-2xl sm:rounded-3xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <IconWrapper size="md" variant="primary" className="flex-shrink-0">
                <Network className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </IconWrapper>
              <div>
                <DialogTitle className="text-lg sm:text-2xl font-bold">
                  <GradientText>Knowledge Graph</GradientText>
                </DialogTitle>
                <DialogDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm hidden sm:block">
                  Interactive visualization of memory connections
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant={showLabels ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowLabels(!showLabels)} 
                className="rounded-lg sm:rounded-xl text-xs h-7 sm:h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Labels</span>
                <span className="sm:hidden">L</span>
              </Button>
              <Button 
                variant={showConnectionLabels ? "default" : "outline"} 
                size="sm" 
                onClick={() => setShowConnectionLabels(!showConnectionLabels)} 
                className="rounded-lg sm:rounded-xl text-xs h-7 sm:h-8 px-2 sm:px-3"
              >
                <span className="hidden sm:inline">Connections</span>
                <span className="sm:hidden">C</span>
              </Button>
              <div className="w-px h-6 bg-border mx-0.5 sm:mx-1 hidden sm:block" />
              <Button variant="outline" size="icon" onClick={handleZoomOut} className="rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8" title="Zoom Out">
                <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetZoom} className="rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex" title="Reset Zoom">
                <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn} className="rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8" title="Zoom In">
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Stats Bar */}
        {!loading && nodes.length > 0 && (
          <div className="px-3 sm:px-6 py-2 sm:py-3 bg-muted/30 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="font-medium">{stats.totalNodes}</span>
                <span className="text-muted-foreground">Memories</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-medium">{stats.totalConnections}</span>
                <span className="text-muted-foreground">Connections</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-medium">{stats.clusters}</span>
                <span className="text-muted-foreground">Clusters</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground items-center gap-1 hidden md:flex">
              <Info className="w-3 h-3" />
              Drag nodes to reposition • Click to select • Hover for details
            </div>
          </div>
        )}

        <div className="flex-1 relative px-2 sm:px-6 pb-3 sm:pb-6 pt-2 sm:pt-4 overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin mx-auto text-primary mb-3 sm:mb-4" />
                <p className="text-xs sm:text-sm text-muted-foreground">Analyzing your memories...</p>
                <p className="text-xs text-muted-foreground mt-2">Building knowledge graph...</p>
              </div>
            </div>
          ) : nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <IconWrapper size="xl" variant="primary" className="mx-auto mb-4">
                  <Network className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </IconWrapper>
                <h3 className="text-base sm:text-lg font-semibold mb-2">No Memories Yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Start adding memories to see how they connect in your knowledge graph!
                </p>
              </div>
            </div>
          ) : (
            <div className="relative h-full rounded-xl sm:rounded-2xl border-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={1050}
                height={600}
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseLeave}
                className="w-full h-full cursor-pointer touch-none"
                style={{ display: 'block' }}
              />
              
              {selectedNode && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-[calc(100%-1rem)] sm:max-w-sm glass-card border-2 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-2xl animate-in">
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <IconWrapper 
                      size="sm"
                      variant="primary"
                      className="flex-shrink-0"
                      style={{ background: getClusterColor(selectedNode.cluster) }}
                    >
                      {selectedNode.type === 'text' ? (
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </IconWrapper>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base mb-2 line-clamp-2">{selectedNode.title}</h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-3">
                        <Badge variant="secondary" className="text-xs">
                          #{selectedNode.index_position}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: getClusterColor(selectedNode.cluster),
                            color: getClusterColor(selectedNode.cluster)
                          }}
                        >
                          Cluster {selectedNode.cluster + 1}
                        </Badge>
                      </div>
                      {selectedNode.content && (
                        <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
                          {selectedNode.content}
                        </p>
                      )}
                      <div className="space-y-1.5 sm:space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                          <Network className="w-3 h-3" />
                          <span className="font-medium">{selectedNode.connections}</span>
                          <span>connection{selectedNode.connections !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span className="hidden sm:inline">{formatDistanceToNow(new Date(selectedNode.created_at), { addSuffix: true })}</span>
                          <span className="sm:hidden">{formatDistanceToNow(new Date(selectedNode.created_at), { addSuffix: true }).split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {hoveredNode && !selectedNode && (
                <div className="absolute top-4 right-4 max-w-xs glass-card border rounded-xl p-3 shadow-xl pointer-events-none animate-in-fast">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: getClusterColor(hoveredNode.cluster) }}
                    />
                    <h4 className="font-semibold text-sm truncate">{hoveredNode.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hoveredNode.connections} connection{hoveredNode.connections !== 1 ? 's' : ''} • 
                    Cluster {hoveredNode.cluster + 1}
                  </p>
                </div>
              )}
              
              <div className="hidden md:block absolute bottom-3 sm:bottom-4 left-3 sm:left-4 glass-card border rounded-xl p-3 sm:p-4 text-xs space-y-2 sm:space-y-3 shadow-lg max-w-xs">
                <div className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2">
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                  Legend
                </div>
                <div className="space-y-2">
                  <div className="font-medium text-xs mb-1">Memory Types:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📝</span>
                    <span>Text Memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📁</span>
                    <span>File Memory</span>
                  </div>
                </div>
                <div className="pt-2 border-t space-y-1">
                  <div className="font-medium text-xs mb-1">Connection Strength:</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-500" />
                    <span>Strong (70%+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-blue-500" />
                    <span>Medium (50-70%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-gray-400" />
                    <span>Weak (&lt;50%)</span>
                  </div>
                </div>
                <div className="pt-2 border-t text-muted-foreground space-y-1">
                  <p>• Badge shows connections</p>
                  <p>• Larger nodes = more central</p>
                  <p>• Colors = different topics</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}