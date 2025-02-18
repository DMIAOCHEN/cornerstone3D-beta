import { _cloneDeep } from 'lodash.clonedeep';
import {
  getEnabledElementByIds,
  volumeLoader,
  VolumeViewport,
  utilities as csUtils,
} from '@cornerstonejs/core';
import type { Types } from '@cornerstonejs/core';

/**
 * Create a new 3D segmentation volume from the default imageData presented in
 * the first actor of the viewport. It looks at the metadata of the imageData
 * to determine the volume dimensions and spacing if particular options are not provided.
 *
 * @param viewportId - The Id of the viewport from which to derive the volume from.
 * @param renderingEngineId - The Id of the rendering engine the viewport belongs to.
 * @param [segmentationId] - The Id to name the generated segmentation. Autogenerated if not given.
 * @param [options] - LabelmapOptions
 * @returns A promise that resolves to the Id of the new labelmap volume.
 */
export default async function createLabelmapVolumeForViewport(input: {
  viewportId: string;
  renderingEngineId: string;
  segmentationId?: string;
  options?: {
    volumeId?: string;
    scalarData?: Float32Array | Uint8Array;
    targetBuffer?: {
      type: 'Float32Array' | 'Uint8Array';
    };
    metadata?: any;
    dimensions?: Types.Point3;
    spacing?: Types.Point3;
    origin?: Types.Point3;
    direction?: Float32Array;
  };
}): Promise<string> {
  const { viewportId, renderingEngineId, options } = input;
  let { segmentationId } = input;
  const enabledElement = getEnabledElementByIds(viewportId, renderingEngineId);

  if (!enabledElement) {
    throw new Error('element disabled');
  }

  const { viewport } = enabledElement;
  if (!(viewport instanceof VolumeViewport)) {
    throw new Error('Segmentation not ready for stackViewport');
  }

  const { uid } = viewport.getDefaultActor();

  if (segmentationId === undefined) {
    // Name the segmentation volume with the viewport Id
    segmentationId = `${uid}-based-segmentation-${
      options?.volumeId ?? csUtils.uuidv4().slice(0, 8)
    }`;
  }

  if (options) {
    // create a new labelmap with its own properties
    // This allows creation of a higher resolution labelmap vs reference volume
    const properties = _cloneDeep(options);
    await volumeLoader.createLocalVolume(properties, segmentationId);
  } else {
    // create a labelmap from a reference volume
    const { uid: volumeId } = viewport.getDefaultActor();
    await volumeLoader.createAndCacheDerivedVolume(volumeId, {
      volumeId: segmentationId,
    });
  }

  return segmentationId;
}
