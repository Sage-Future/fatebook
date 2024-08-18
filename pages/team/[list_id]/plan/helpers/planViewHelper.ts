import { Node } from "@xyflow/react";

export const DAY_WIDTH = 20;
const NUMBER_OF_WEEKS = 8;

export const WEEK_WIDTH = 7 * DAY_WIDTH;
export const TOTAL_WIDTH = NUMBER_OF_WEEKS * WEEK_WIDTH;

export function mapPositionToDate(position: number): Date {
  const baseDate = new Date();
  const resultDate = new Date(baseDate);
  resultDate.setDate(resultDate.getDate() + position/DAY_WIDTH);
  return resultDate;
}

export function mapDateToPosition(targetDate: Date): number {
  const baseDate = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;

  const dateDifference = targetDate.getTime() - baseDate.getTime()
  const differenceInDays = Math.floor(dateDifference/ msPerDay) + 1;

  return differenceInDays * DAY_WIDTH;
}

export function getDayNodes(): [Node[], Node[]] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  const endDate = new Date(today);

  startDate.setMonth(startDate.getMonth() - 3);
  endDate.setMonth(endDate.getMonth() + 3);

  const dayNodes: Node[] = [];
  const weekNodes: Node[] = [];

  for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    dayNodes.push({
        id: `day-${day}-${month}-${year}`,
        type: 'day',
        draggable: false,
        selectable: false,
        data: {
          label: day
        },
        position: { x: mapDateToPosition(date), y: 40 },
    });

    if (dayOfWeek == 1) {
      weekNodes.push({
        id: `week-${day}-${month}-${year}`,
        type: 'week',
        draggable: false,
        selectable: false,
        data: {},
        position: { x: mapDateToPosition(date), y: 40}
      })
    }
  }

  return [dayNodes, weekNodes]
}


export function getMonthNodes(): Node[] {
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);

  today.setHours(0, 0, 0, 0);

  startDate.setMonth(startDate.getMonth() - 3);
  endDate.setMonth(endDate.getMonth() + 3);

  const monthNodes: Node[] = [];

  for (let date = startDate; date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    monthNodes.push({
        id: `month-${month}-${year}`,
        type: 'month',
        draggable: false,
        selectable: false,
        data: {
          label: date.toLocaleString('default', { month: 'long' }),
          width: getDaysInMonth(date) * DAY_WIDTH
        },
        position: { x: mapDateToPosition(new Date(year, month - 1, 1)), y: 0 },
    });
  }

  return monthNodes
}

function getDaysInMonth(date: Date): number {
  const nextMonth: Date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  nextMonth.setDate(nextMonth.getDate() - 1);

  return nextMonth.getDate();
}
