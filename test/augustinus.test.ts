import { describe, it, expect } from 'vitest';
import generateGabc, { defaultModels } from '../packages/core/src/augustinus';
import { smallTestCases } from './small-test-cases';

describe('Augustinus Core - Functional Tests (Small Cases)', () => {
    
    smallTestCases.forEach(testCase => {
        it(testCase.description, () => {
            const model = defaultModels.find(m => m.name === testCase.model);
            if (!model) {
                throw new Error(`Model not found: ${testCase.model}`);
            }
            
            const result = generateGabc(testCase.text, model as any, testCase.parameters);
            
            if (testCase.expectedInclude) {
                testCase.expectedInclude.forEach(inc => {
                    expect(result).toContain(inc);
                });
            }
            
            if (testCase.expectedExclude) {
                testCase.expectedExclude.forEach(exc => {
                    expect(result).not.toContain(exc);
                });
            }

            // Always ensure basic validity
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });
});
