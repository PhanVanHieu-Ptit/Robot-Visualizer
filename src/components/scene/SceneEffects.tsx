import { EffectComposer, Bloom, SSAO, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export function SceneEffects() {
  return (
    <EffectComposer>
      <Bloom intensity={0.4} luminanceThreshold={0.6} luminanceSmoothing={0.9} />
      <SSAO
        radius={0.5}
        intensity={0.5}
        luminanceInfluence={0.6}
        blendFunction={BlendFunction.MULTIPLY}
      />
      <Vignette darkness={0.4} offset={0.3} />
    </EffectComposer>
  );
}
