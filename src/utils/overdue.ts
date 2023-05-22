export function loanOverdue(dueDate: Date) {
  const currentDate = new Date();

  const daysOverdue = Math.ceil(
    (currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysOverdue;
}
