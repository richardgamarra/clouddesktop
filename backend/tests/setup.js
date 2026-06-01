const { execSync } = require('child_process')

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test'
  try {
    execSync('node -e "require(\'./db/pool\').query(\'SELECT 1\').then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})"',
      { cwd: __dirname + '/..', stdio: 'inherit', timeout: 5000 })
  } catch {
    throw new Error('Database not reachable — check .env DB credentials before running tests')
  }
}
