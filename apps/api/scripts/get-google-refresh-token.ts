import 'dotenv/config';
import * as http from 'http';
import { URL } from 'url';
import { OAuth2Client } from 'google-auth-library';

const PORT = 3457;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function main(): void {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error(
      'Falta GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en apps/api/.env',
    );
    process.exit(1);
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log(
    '\nAbre esta URL, entra con la cuenta de Google que quieres conectar y da permiso:\n',
  );
  console.log(authUrl);
  console.log('\nEsperando el callback en ' + REDIRECT_URI + ' ...\n');

  const server = http.createServer((req, res) => {
    if (!req.url) return;

    const url = new URL(req.url, REDIRECT_URI);
    const code = url.searchParams.get('code');
    if (!code) {
      res.end('No llegó ningún "code" en la URL.');
      return;
    }

    oauth2Client
      .getToken(code)
      .then(({ tokens }) => {
        res.end('Listo, ya puedes cerrar esta pestaña. Revisa la terminal.');
        console.log('\nGOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
        console.log(
          '\nCopia esa línea en apps/api/.env y reinicia el servidor.\n',
        );
        server.close();
        process.exit(0);
      })
      .catch((error: unknown) => {
        res.end('Error al canjear el code, revisa la terminal.');
        console.error(error);
        server.close();
        process.exit(1);
      });
  });

  server.listen(PORT);
}

main();
