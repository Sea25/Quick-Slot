/** Add hours to HH:MM:SS time string, returns HH:MM:SS */
export function addHoursToTime(timeStr, hours) {
  const [h, m, s = 0] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + hours * 60;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function timesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
