import { StorageType, TempReading } from '../types';

export interface TelemetrySafetyResult {
  status: 'safe' | 'warning' | 'critical' | 'missing' | 'stale' | 'invalid';
  tempC?: number;
  targetTempC: number;
  thresholdLabel: string;
  message: string;
  violatesThreshold: boolean;
  isSimulated: boolean;
  ageMinutes?: number;
  isStale: boolean;
}

export const TELEMETRY_THRESHOLDS = {
  hot: {
    target: 65,
    safeMin: 60.0,
    warningMin: 55.0,
    label: 'HACCP Hot-Holding (≥60.0°C)',
    unit: '°C',
  },
  chilled: {
    target: 4.0,
    safeMax: 4.5,
    warningMax: 8.0,
    label: 'Cold-Chain (≤4.5°C, max 8.0°C)',
    unit: '°C',
  },
  ambient: {
    target: 20.0,
    safeMin: 15.0,
    safeMax: 24.0,
    warningMax: 30.0,
    label: 'Ambient Pantry (15.0°C – 24.0°C)',
    unit: '°C',
  },
} as const;

export const SIMULATED_SENSOR_LABEL = 'SIMULATED SENSOR (DEMO MODEL)';
export const SIMULATED_DISCLAIMER =
  'Simulated Sensor Reading: Physical HACCP food safety certification requires on-site calibrated probe verification. No real hardware sensor is attached.';

/**
 * Evaluates thermal safety of a reading against storage-type physical parameters.
 * Strictly flags violations, missing, invalid, or stale telemetry.
 */
export function evaluateThermalSafety(
  reading: TempReading | undefined | null,
  storageType: StorageType = 'hot',
  maxAgeMinutes: number = 30
): TelemetrySafetyResult {
  const config = TELEMETRY_THRESHOLDS[storageType] || TELEMETRY_THRESHOLDS.hot;

  // 1. Missing reading check
  if (!reading || typeof reading.tempC !== 'number') {
    return {
      status: 'missing',
      targetTempC: config.target,
      thresholdLabel: config.label,
      message: 'No sensor telemetry sample recorded for this lot.',
      violatesThreshold: true,
      isSimulated: true,
      isStale: false,
    };
  }

  // 2. Invalid reading check
  if (isNaN(reading.tempC) || reading.tempC < -50 || reading.tempC > 150) {
    return {
      status: 'invalid',
      tempC: reading.tempC,
      targetTempC: config.target,
      thresholdLabel: config.label,
      message: `Invalid sensor reading (${reading.tempC}). Out of physical operating range.`,
      violatesThreshold: true,
      isSimulated: Boolean(reading.isSimulated),
      isStale: false,
    };
  }

  // 3. Stale reading check
  const now = Date.now();
  let isStale = false;
  let ageMinutes: number | undefined;

  if (typeof reading.timestamp === 'number' && reading.timestamp > 0) {
    ageMinutes = Math.max(0, Math.round((now - reading.timestamp) / 60000));
    if (ageMinutes > maxAgeMinutes) {
      isStale = true;
    }
  }

  const isSimulated = reading.isSimulated !== false; // Default to true unless explicitly verified real
  const temp = reading.tempC;

  // 4. Threshold evaluations by storage type
  if (storageType === 'hot') {
    const hotConfig = TELEMETRY_THRESHOLDS.hot;
    if (temp >= hotConfig.safeMin) {
      return {
        status: isStale ? 'stale' : 'safe',
        tempC: temp,
        targetTempC: hotConfig.target,
        thresholdLabel: hotConfig.label,
        message: isStale
          ? `Reading (${temp}°C) is stale (${ageMinutes}m ago). Re-probe required.`
          : `Core temp ${temp}°C is within safe hot-holding threshold (≥60°C).`,
        violatesThreshold: false,
        isSimulated,
        ageMinutes,
        isStale,
      };
    } else if (temp >= hotConfig.warningMin) {
      return {
        status: 'warning',
        tempC: temp,
        targetTempC: hotConfig.target,
        thresholdLabel: hotConfig.label,
        message: `Core temp ${temp}°C is approaching safety floor (55–60°C). Accelerate transit.`,
        violatesThreshold: true,
        isSimulated,
        ageMinutes,
        isStale,
      };
    } else {
      return {
        status: 'critical',
        tempC: temp,
        targetTempC: hotConfig.target,
        thresholdLabel: hotConfig.label,
        message: `CRITICAL HACCP VIOLATION: Core temp ${temp}°C dropped below 55°C danger floor. Bacterial risk.`,
        violatesThreshold: true,
        isSimulated,
        ageMinutes,
        isStale,
      };
    }
  }

  if (storageType === 'chilled') {
    const chilledConfig = TELEMETRY_THRESHOLDS.chilled;
    if (temp <= chilledConfig.safeMax) {
      return {
        status: isStale ? 'stale' : 'safe',
        tempC: temp,
        targetTempC: chilledConfig.target,
        thresholdLabel: chilledConfig.label,
        message: isStale
          ? `Reading (${temp}°C) is stale (${ageMinutes}m ago). Re-probe required.`
          : `Chilled core temp ${temp}°C is compliant with cold-chain standards (≤4.5°C).`,
        violatesThreshold: false,
        isSimulated,
        ageMinutes,
        isStale,
      };
    } else if (temp <= chilledConfig.warningMax) {
      return {
        status: 'warning',
        tempC: temp,
        targetTempC: chilledConfig.target,
        thresholdLabel: chilledConfig.label,
        message: `Elevated chilled temp ${temp}°C (4.5–8.0°C). Verify thermal pack integrity.`,
        violatesThreshold: true,
        isSimulated,
        ageMinutes,
        isStale,
      };
    } else {
      return {
        status: 'critical',
        tempC: temp,
        targetTempC: chilledConfig.target,
        thresholdLabel: chilledConfig.label,
        message: `CRITICAL COLD-CHAIN BREAK: Chilled temp ${temp}°C exceeds 8.0°C ceiling. Spoilage risk.`,
        violatesThreshold: true,
        isSimulated,
        ageMinutes,
        isStale,
      };
    }
  }

  // Ambient
  const ambientConfig = TELEMETRY_THRESHOLDS.ambient;
  if (temp >= ambientConfig.safeMin && temp <= ambientConfig.safeMax) {
    return {
      status: isStale ? 'stale' : 'safe',
      tempC: temp,
      targetTempC: ambientConfig.target,
      thresholdLabel: ambientConfig.label,
      message: isStale
        ? `Ambient reading (${temp}°C) is stale (${ageMinutes}m ago).`
        : `Ambient holding temp ${temp}°C is normal (15–24°C).`,
      violatesThreshold: false,
      isSimulated,
      ageMinutes,
      isStale,
    };
  } else if (temp <= ambientConfig.warningMax && temp >= 10.0) {
    return {
      status: 'warning',
      tempC: temp,
      targetTempC: ambientConfig.target,
      thresholdLabel: ambientConfig.label,
      message: `Ambient holding temp ${temp}°C is slightly outside optimal band.`,
      violatesThreshold: true,
      isSimulated,
      ageMinutes,
      isStale,
    };
  } else {
    return {
      status: 'critical',
      tempC: temp,
      targetTempC: ambientConfig.target,
      thresholdLabel: ambientConfig.label,
      message: `Extreme ambient temp ${temp}°C. Inspect food packaging immediately.`,
      violatesThreshold: true,
      isSimulated,
      ageMinutes,
      isStale,
    };
  }
}

/**
 * Generates physically bounded simulated telemetry sample with real wall-clock timestamps.
 */
export function generateSimulatedTelemetrySample(
  storageType: StorageType = 'hot',
  currentTelemetry: TempReading[] = []
): TempReading {
  const lastSample = currentTelemetry[currentTelemetry.length - 1];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let newTemp: number;
  if (storageType === 'hot') {
    // Insulated Cambro tote: slow heat dissipation (-0.1 to -0.3 °C)
    const base = lastSample ? lastSample.tempC : 66.0;
    const delta = (Math.random() * 0.25 + 0.05);
    newTemp = Math.round((base - delta) * 10) / 10;
    if (newTemp < 52) newTemp = 52.0; // clamp
  } else if (storageType === 'chilled') {
    // Chilled cool tote: slow ambient absorption (+0.1 to +0.2 °C)
    const base = lastSample ? lastSample.tempC : 3.6;
    const delta = (Math.random() * 0.2 + 0.05);
    newTemp = Math.round((base + delta) * 10) / 10;
    if (newTemp > 12) newTemp = 12.0; // clamp
  } else {
    // Ambient pantry: small fluctuations
    const base = 20.2;
    const delta = (Math.random() * 0.6 - 0.3);
    newTemp = Math.round((base + delta) * 10) / 10;
  }

  const evalResult = evaluateThermalSafety(
    { time: timeStr, timestamp: now.getTime(), tempC: newTemp, status: 'safe', isSimulated: true },
    storageType
  );

  return {
    time: timeStr,
    timestamp: now.getTime(),
    tempC: newTemp,
    status: evalResult.status === 'safe' ? 'safe' : evalResult.status === 'warning' ? 'warning' : 'critical',
    isSimulated: true,
    notes: 'Simulated IoT probe telemetry reading',
  };
}
