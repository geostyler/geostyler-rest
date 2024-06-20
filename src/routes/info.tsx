import { html } from '@elysiajs/html'
import { Handler } from 'elysia';

export const versions: Handler = ({
  request
}) => {
  if (request.headers.get('accept') === 'text/html') {
    return (
      <html lang='en'>
          <head>
              <title>Hello World</title>
          </head>
          <body>
              <h1>Hello World</h1>
          </body>
      </html>
    );
  } else {
    return {
      peter: 'pan'
    };
  }
};
