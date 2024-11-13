import { generateApi } from 'swagger-typescript-api';
import path from 'path';
import fs from 'fs';

const OUTPUT_PATH = path.resolve(process.cwd(), 'src/client/types/api');

async function generateTypes() {
  try {
    if (!fs.existsSync(OUTPUT_PATH)) {
      fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    }

    await generateApi({
      name: 'api.types.ts',
      output: OUTPUT_PATH,
      url: 'http://localhost:3001/api-docs/swagger.json',
      generateClient: true,
      generateRouteTypes: true,
      moduleNameFirstTag: true,
      extractRequestParams: true,
      extractRequestBody: true,
      extractResponseBody: true,
      modular: true,
      hooks: {
        onCreateComponent: (component) => {
          return Object.assign(component, {
            typeName: component.typeName.replace(/«|»/g, '_'),
          });
        },
      },
    });

    console.log('Types generated successfully!');
  } catch (error) {
    console.error('Error generating types:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

generateTypes();
