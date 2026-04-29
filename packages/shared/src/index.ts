export enum UserRole {
  STUDENT = 'student',
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin',
}

export enum TopicCategory {
  MONEY_FUNCTIONS = 'money_functions',
  INCOME_EXPENSES = 'income_expenses',
  FAMILY_BUDGET = 'family_budget',
  SAVINGS = 'savings',
  PURCHASES_PRICES = 'purchases_prices',
  BANKING_SERVICES = 'banking_services',
}

export enum TaskType {
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCHING = 'matching',
  OPEN_ANSWER = 'open_answer',
  GAME_SCENARIO = 'game_scenario',
}

export interface SubmitTaskDto {
  taskId: number;
  answer: unknown;
  timeSpentMs: number;
}

export interface RewardResponse {
  reward: number;
  isGolden: boolean;
  newBalance: number;
  newAchievements: number[];
}
