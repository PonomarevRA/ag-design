/** Portable guideline data. Importing never reads files or contacts a service. */
import guidelines from './guidelines.json' with { type: 'json' };
export { guidelines };

import designRequirements from './design-requirements.json' with { type: 'json' };
export { designRequirements };

// System aesthetics remain declarative; importing never applies a theme or changes component behavior.
import systemStyles from './system-styles.json' with { type: 'json' };
export { systemStyles };

// Dated guidance data only; importing does not register actions or contact assistants.
import assistantPlatforms from './assistant-platforms.json' with { type: 'json' };
export { assistantPlatforms };
