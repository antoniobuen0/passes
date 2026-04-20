import { useEffect, useRef } from "react";

export function WgslBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gpu = (navigator as Navigator & { gpu?: any }).gpu;
    if (!gpu) return;

    let rafId = 0;
    let isDisposed = false;

    const init = async () => {
      try {
        const adapter = await gpu.requestAdapter();
        if (!adapter || isDisposed) return;

        const device = await adapter.requestDevice();
        if (isDisposed) return;

        const context = canvas.getContext("webgpu") as any;
        if (!context) return;

        const gpuBufferUsage = (window as any).GPUBufferUsage;
        const gpuShaderStage = (window as any).GPUShaderStage;

        const format = gpu.getPreferredCanvasFormat();

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
          const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
          const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
          canvas.width = width;
          canvas.height = height;

          context.configure({
            device,
            format,
            alphaMode: "premultiplied",
          });
        };

        resize();

        const shaderCode = `
          struct Uniforms {
            time: f32,
            width: f32,
            height: f32,
            pad: f32,
          }

          @group(0) @binding(0)
          var<uniform> uniforms: Uniforms;

          @vertex
          fn vs_main(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
            var positions = array<vec2f, 3>(
              vec2f(-1.0, -3.0),
              vec2f(3.0, 1.0),
              vec2f(-1.0, 1.0)
            );
            return vec4f(positions[index], 0.0, 1.0);
          }

          fn hash(p: vec2f) -> f32 {
            return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
          }

          fn noise(p: vec2f) -> f32 {
            let i = floor(p);
            let f = fract(p);
            let u = f * f * (3.0 - 2.0 * f);

            return mix(
              mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
              mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
              u.y
            );
          }

          @fragment
          fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
            let resolution = vec2f(uniforms.width, uniforms.height);
            let uv = pos.xy / resolution;
            let p = (uv - 0.5) * vec2f(resolution.x / resolution.y, 1.0) * 2.2;
            let t = uniforms.time * 0.15;

            let n1 = noise(p * 3.2 + vec2f(t, -t * 0.65));
            let n2 = noise(p * 5.1 + vec2f(-t * 0.5, t * 0.92));
            let n3 = noise(p * 8.4 + vec2f(t * 0.32, t * 1.2));
            let liquid = smoothstep(0.55, 1.0, n1 * 0.45 + n2 * 0.35 + n3 * 0.2);

            let base = vec3f(0.02, 0.22, 0.62);
            let glow = vec3f(0.25, 0.82, 1.0);
            let color = mix(base, glow, liquid);

            let vignette = smoothstep(1.25, 0.2, length(p));
            let alpha = (0.08 + liquid * 0.25) * vignette;

            return vec4f(color, alpha);
          }
        `;

        const shaderModule = device.createShaderModule({ code: shaderCode });

        const uniformBuffer = device.createBuffer({
          size: 16,
          usage: gpuBufferUsage.UNIFORM | gpuBufferUsage.COPY_DST,
        });

        const bindGroupLayout = device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: gpuShaderStage.FRAGMENT,
              buffer: { type: "uniform" },
            },
          ],
        });

        const pipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
          vertex: {
            module: shaderModule,
            entryPoint: "vs_main",
          },
          fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [{ format }],
          },
          primitive: {
            topology: "triangle-list",
          },
        });

        const bindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: { buffer: uniformBuffer },
            },
          ],
        });

        const onResize = () => resize();
        window.addEventListener("resize", onResize, { passive: true });

        const start = performance.now();

        const frame = (now: number) => {
          if (isDisposed) return;

          const uniforms = new Float32Array([
            (now - start) / 1000,
            canvas.width,
            canvas.height,
            0,
          ]);

          device.queue.writeBuffer(uniformBuffer, 0, uniforms);

          const encoder = device.createCommandEncoder();
          const pass = encoder.beginRenderPass({
            colorAttachments: [
              {
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: "clear",
                storeOp: "store",
              },
            ],
          });

          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bindGroup);
          pass.draw(3, 1, 0, 0);
          pass.end();

          device.queue.submit([encoder.finish()]);
          rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);

        return () => {
          window.removeEventListener("resize", onResize);
        };
      } catch {
        return;
      }
    };

    let cleanupResize: (() => void) | undefined;
    init().then((cleanup) => {
      cleanupResize = cleanup;
    });

    return () => {
      isDisposed = true;
      cancelAnimationFrame(rafId);
      cleanupResize?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
