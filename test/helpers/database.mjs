import levelup from 'levelup';
import memdown from 'memdown';

export { createDatabase };

function createDatabase() {
  return levelup(memdown());
}
