import 'fake-indexeddb/auto';
import { setupOPFSMock } from '../helpers/opfs-mock';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

setupOPFSMock();
expect.extend(matchers);
