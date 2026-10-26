import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { i18n } from '~/shared/i18n';

beforeEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage('ru');
});

afterEach(() => cleanup());
