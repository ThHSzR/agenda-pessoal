const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize with the database configuration
const sequelize = new Sequelize('database_name', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres', // or your dialect of choice
});

// Define the models representing your tables
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  title: { type: DataTypes.STRING, allowNull: false },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { timestamps: true });

// Define associations
User.hasMany(Task, { foreignKey: 'userId' });
Task.belongsTo(User, { foreignKey: 'userId' });

// Migrations
async function syncDatabase() {
  await sequelize.sync({ alter: true }); // Use 'force: true' only in development
}

// Seed data
async function seedDatabase() {
  await User.bulkCreate([
    { name: 'John Doe', email: 'john@example.com', password: 'hashed_password' },
    { name: 'Jane Smith', email: 'jane@example.com', password: 'hashed_password' },
  ]);

  await Task.bulkCreate([
    { userId: 1, title: 'Task 1', completed: false },
    { userId: 1, title: 'Task 2', completed: true },
    { userId: 2, title: 'Task 3', completed: false },
  ]);
}

// Export the modules
module.exports = { sequelize, User, Task, syncDatabase, seedDatabase };