import "@testing-library/jest-dom" // Must import to expose some functions like .toBeInTheDocument()
import { render } from "@testing-library/react"
import { FormattedDate } from "../FormattedDate"

jest.useFakeTimers().setSystemTime(new Date("2023-08-02"))

describe("FormattedDate", () => {
  it("does not render anything if no date is provided", () => {
    const { container } = render(<FormattedDate date={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders with custom prefix and postfix", () => {
    const { getByText } = render(
      <FormattedDate
        date={new Date("2022-01-01T12:00:00Z")}
        prefix="Start: "
        postfix=" End"
      />,
    )
    expect(getByText("Start: Jan 1st 2022 End")).toBeInTheDocument()
  })

  it("renders 'today' if currentDateShowToday and it is today", () => {
    const { getByText } = render(
      <FormattedDate
        date={new Date("2023-08-02")}
        currentDateShowToday={true}
      />,
    )
    expect(getByText("today")).toBeInTheDocument()
  })

  it("includes the year if it's not the current year, and omits it if it is", () => {
    const currentYear = new Date().getFullYear()
    const lastYear = new Date(currentYear - 1, 5, 15) // June 15th of last year
    const nextYear = new Date(currentYear + 1, 5, 15) // June 15th of next year

    const { getByText: getByTextLastYear } = render(
      <FormattedDate date={lastYear} />,
    )
    expect(
      getByTextLastYear(`June 15th ${lastYear.getFullYear()}`),
    ).toBeInTheDocument()

    const { getByText: getByTextNextYear } = render(
      <FormattedDate date={nextYear} />,
    )
    expect(
      getByTextNextYear(`June 15th ${nextYear.getFullYear()}`),
    ).toBeInTheDocument()

    const { queryByText: queryByTextThisYear } = render(
      <FormattedDate date={new Date(currentYear, 5, 15)} />,
    )
    expect(
      queryByTextThisYear(`June 15th ${currentYear}`),
    ).not.toBeInTheDocument()
  })

  it("renders 'In 3 days' when date is 3 days from now and capitalise is true", () => {
    jest.useFakeTimers().setSystemTime(new Date("2023-08-02"))
    const { getByText } = render(
      <FormattedDate
        date={new Date("2023-08-05T12:00:00Z")}
        capitalise={true}
      />,
    )
    expect(getByText("In 3 days")).toBeInTheDocument()
  })

  it("renders with distance formatting when alwaysUseDistance is true", () => {
    const { getByText } = render(
      <FormattedDate
        date={new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)} // ~3 months
        alwaysUseDistance={true}
      />,
    )
    expect(getByText("3 months ago")).toBeInTheDocument()
  })

  it("renders with distance formatting when date is within 8 weeks in the past", () => {
    const { getByText } = render(
      <FormattedDate
        date={new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 7)}
      />,
    )
    expect(getByText("2 months ago")).toBeInTheDocument()
  })

  it("renders with distance formatting when date is within 1 week in the future", () => {
    const { getByText } = render(
      <FormattedDate date={new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)} />,
    )
    expect(getByText("in 3 days")).toBeInTheDocument()
  })

  it("fails", () => {
    throw new Error("Failing test")
  })
})
