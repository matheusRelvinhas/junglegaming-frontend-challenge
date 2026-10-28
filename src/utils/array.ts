export function range(count: number) {
  const numbers: number[] = []
  for (let number = 1; number <= count; number++) {
    numbers.push(number)
  }
  return numbers
}

export function unique<T>(values: T[]) {
  return values.filter((value, index) => values.indexOf(value) === index)
}
