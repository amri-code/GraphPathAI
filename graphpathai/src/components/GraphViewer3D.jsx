import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import useGraphStore from "../store/graphStore";

export default function GraphViewer3D() {
  const { nodes, edges } = useGraphStore();
  const SPACE_SIZE = 600;

  // 1️⃣ Place nodes randomly in a 600³ cube
  const nodePositions = useMemo(() => {
    const m = new Map();
    nodes.forEach((node) => {
      const x = Math.random() * SPACE_SIZE - SPACE_SIZE / 2;
      const y = Math.random() * SPACE_SIZE - SPACE_SIZE / 2;
      const z = Math.random() * SPACE_SIZE - SPACE_SIZE / 2;
      m.set(node.id, new THREE.Vector3(x, y, z));
    });
    return m;
  }, [nodes]);

  // 2️⃣ Compute the geometric center of all nodes
  const center = useMemo(() => {
    if (nodes.length === 0) return new THREE.Vector3(0, 0, 0);
    const sum = nodes.reduce((acc, node) => acc.add(nodePositions.get(node.id)), new THREE.Vector3());
    return sum.divideScalar(nodes.length);
  }, [nodes, nodePositions]);

  // 3️⃣ Build the edge‐lines geometry
  const edgeLines = useMemo(() => {
    const pts = [];
    edges.forEach(({ from, to }) => {
      const p1 = nodePositions.get(from);
      const p2 = nodePositions.get(to);
      if (p1 && p2) pts.push(p1, p2);
    });
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [edges, nodePositions]);

  return (
    <div
      style={{
        width: "80vw",          // 80% of viewport width
        height: "85vh",         // 85% of viewport height
        margin: "20px auto",    // center horizontally
        borderRadius: 8,
        boxShadow: "0 0 12px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      {nodes.length === 0 ? (
        <p style={{ color: "#aaa", textAlign: "center", paddingTop: 40 }}>
          Upload a CSV to visualize the graph
        </p>
      ) : (
        <Canvas
          camera={{
            position: [center.x, center.y, center.z + SPACE_SIZE * 1.2],
            fov: 50,
          }}
        >
          {/* Lights */}
          <ambientLight intensity={0.5} />
          <pointLight position={[100, 100, 100]} />

          {/* Helpers & Box */}
          <axesHelper args={[SPACE_SIZE / 2]} />
          <gridHelper
            args={[SPACE_SIZE, 50]}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, 0, -SPACE_SIZE / 2]}
          />
          <mesh>
            <boxGeometry args={[SPACE_SIZE, SPACE_SIZE, SPACE_SIZE]} />
            <meshBasicMaterial color="white" transparent opacity={0.05} wireframe />
          </mesh>

          {/* Edges */}
          <lineSegments geometry={edgeLines}>
            <lineBasicMaterial color="gray" />
          </lineSegments>

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = nodePositions.get(node.id);
            return (
              <mesh key={node.id} position={pos}>
                <sphereGeometry args={[2.5, 16, 16]} />
                <meshStandardMaterial color="orange" />
                <Text
                  fontSize={4}
                  color="black"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0, 3]}
                >
                  {node.id}
                </Text>
              </mesh>
            );
          })}

          {/* OrbitControls centered on the computed center */}
          <OrbitControls
            target={[center.x, center.y, center.z]}
            enableZoom
            enablePan
            enableRotate
          />
        </Canvas>
      )}
    </div>
  );
}
