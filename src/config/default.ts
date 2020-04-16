import settings from './settings';

interface IData {
  [key: string]: any;
}

// Some basic config
const defaultConfig: IData = {
  title: 'TypeScript Server'
};

// Environment config
const server: IData = {
  development: {
    HOST: '0.0.0.0',
    PORT: 3000,
    HTTPS: false
  },
  test: {
    HOST: '0.0.0.0',
    PORT: 3000,
    HTTPS: true,
  },
  production: {
    HOST: '0.0.0.0',
    PORT: 3000,
    HTTPS: true,
  }
};

export default {
  server: {...server[process.env.NODE_ENV || 'development']},
  ...defaultConfig,
  ...settings,
};
