"use strict";

const totalTasks = 12;
const completedTasks = 5;
const dailyLimit = 3;

const validTotal = Number.isFinite(totalTasks) &&
  Number.isInteger(totalTasks) && totalTasks >= 0 && totalTasks <= 1000;
const validCompleted = Number.isFinite(completedTasks) &&
  Number.isInteger(completedTasks) && completedTasks >= 0 &&
  completedTasks <= totalTasks;
const validLimit = Number.isFinite(dailyLimit) &&
  Number.isInteger(dailyLimit) && dailyLimit >= 1 && dailyLimit <= 1000;

if (!validTotal || !validCompleted || !validLimit) {
  console.log("Ошибка: проверьте количества задач и дневную норму (целое число от 1 до 1000)");
} else {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
  } else {
    console.log(`Осталось задач: ${remainingTasks}`);
  }

  while (remainingTasks > 0) {
    day += 1;
    const tasksToday = Math.min(dailyLimit, remainingTasks);
    remainingTasks -= tasksToday;
    console.log(`День ${day}: выполнено ${tasksToday}, осталось ${remainingTasks}`);
  }

  console.log(`Потребуется дней: ${day}`);
}
