import { NextSeo } from "next-seo"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import clsx from "clsx"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeftIcon } from "@heroicons/react/24/solid"

export const metadata = {
  title: "Concrete benefits of making predictions",
  date: "2024-10-17",
  author: "Jonny Spicer",
  authorLink: "https://fatebook.io/user/Jonny-Spicer--289"
}

export default function BlogPage() {
  return (
    <div className="prose mx-auto my-8 px-4">
      <Link href="/blog" className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Blog
      </Link>
      <NextSeo 
        title={metadata.title} 
        description="Discover how making predictions can improve productivity, decision-making, and goal-setting. Learn practical tips for harnessing the power of forecasting in your personal and professional life."
        canonical="https://fatebook.io/blog/concrete-benefits-of-making-predictions"
      />
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, children, ...props }) => {
            const hasImage = node?.children?.some(
              (child) => child.type === "element" && child.tagName === "img"
            )

            if (hasImage) {
              return (
                <p {...props} className={clsx("-mx-4 my-0")}>
                  {children}
                </p>
              )
            }

            return <p {...props}>{children}</p>
          },
          img: ({ src, alt, className}) => {
            return (
              <Image
                src={src || ""}
                alt={alt || ""}
                width={800}
                height={450}
                className={clsx(className, "my-0")}
                loading="lazy"
              />
            )
          },
        }}
      >
        {blogMd}
      </ReactMarkdown>
    </div>
  )
}

const blogMd = String.raw`
# **${metadata.title}**
*${metadata.date} by [${metadata.author}](${metadata.authorLink})*

Your mind is a prediction machine, constantly trying to anticipate the world around you and altering its forecasts based on new information. It’s always doing this as a background process. But what would happen if you deliberately trained this skill? Could you get better at predicting your projects, your life, and the future?

Sadly, I don’t have a crystal ball, but I have found *trying* to see the future valuable. I can't be certain about what will happen, but by deliberately practising the skill of prediction, I can create feedback loops that allow me to better anticipate what the future will bring. This has indeed helped me become happier, better to interact with, and more impactful.

Concretely, making probabilistic predictions has helped me:

- Improve my productivity
- Make better decisions about my career and living situation
- Set and make progress towards my goals
- Prioritise work tasks
- Communicate project timelines and uncertainties
- Keep myself accountable
- Manage anxiety
- Understand my relationships better
- Improve my metacognition, along with related skills

I’m building [Fatebook](https://fatebook.io/) to make it as quick and easy as possible for you to harness the power of prediction and reap some of the benefits above, while remaining completely free. The first step to getting value from predictions is to figure out what to make those predictions about, which I’ve had plenty of time to tinker with.

## **Which questions are worth asking?**

Practice and creativity have allowed me to get more value out of the questions I ask, and the predictions I make. For example, it has helped me communicate with my team better around project timelines, hiring decisions and strategy prioritization. We share predictions with one another using [Fatebook for Slack](https://fatebook.io/for-slack) on questions like:

![Will Jonny finish writing this blog post by Friday?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/blog_post_by_friday.png&w=3840&q=75)

This question allows me to set expectations very accurately with my team. If writing the blog post is taking longer than expected, I can decrease my prediction that it’ll be done by Friday, which is a low-friction way of letting others know about my updated timelines.

![If we add "sign up with email", will we get 500 new users the month afterwards?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/sign_up_with_email.png&w=3840&q=75)
![If we add numeric questions, will we get 500 new users the month afterwards?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/numeric_questions.png&w=3840&q=75)

Sharing predictions makes it much easier to reach consensus about what work should be top priority. If we’re aiming to grow and my team all predict that implementing the “sign up with email” feature is more likely to get us 500 new users, then it’s obvious we should do it first. Or, if the probability of either feature attracting new users is low, that’s a sign we should consider other options. When there’s disagreement between team members, it is easier to have a constructive discussion using concrete numbers - and, crucially, when we come back and resolve the questions, there’s a chance to reflect as a team on which factors were important and which were overlooked.

![Will we hire Alice?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/hire_alice.png&w=3840&q=75)

We use questions like “will we hire Alice?” to share our current expectations about working with candidates at a glance - if my prediction that we hire someone is meaningfully higher than my teammates, this is a good way to initiate a discussion about why I’d be so excited to work with them. It helps us be aligned throughout the hiring process, so we don’t have mismatched expectations at the point when we need to decide whether or not to make an offer.

When I submit code changes to a project (known as a pull request, or PR), I want the reviewer to accept it without significant alterations; otherwise the ensuing back-and-forth will be an inefficient use of both of our time. Similarly, I don’t want to later have to undo any of those changes, or to find unexpected behaviour when those changes go live. To maximise the chance of my pull requests going smoothly, [I wrote a script](https://gist.github.com/jonnyspicer/6ca946d1c81fd76d242517572416a017) that asks me to make predictions about these outcomes before submitting my PR.

![Will this PR be approved by the reviewers with no changes requested?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/approved_with_no_changes.png&w=3840&q=75)
![Will any commits in this PR be reverted in the next 24 hours?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/commits_reverted.png&w=3840&q=75)
![Will additional work later be required in order to complete this task?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/additional_work.png&w=3840&q=75)
![Will I discover unexpected behaviour in production in the next week?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/unexpected_behaviour.png&w=3840&q=75)

If my prediction that the PR gets approved first-time is low, say below 75%, then this is a sign that I ought to spend more time polishing the changes before submitting them for review. I can spend some more time going over my own code and checking that it meets the required standards, before again making a prediction - this process can be repeated until I’d be shocked if the reviewer did not accept all of my changes.

I often feel anxious about sending important emails, particularly to people I don’t know well. In the case where I need to email one of our funders, Bob, I can make predictions to help:

![Will I email Bob by the end of the day?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/email_bob.png&w=3840&q=75)
![If I email Bob, will he respond negatively?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/negative_bob.png&w=3840&q=75)

The first question helps keep me accountable - it would feel painful to acknowledge that something I thought was 95% likely to happen did not come to pass, which might be the nudge I need to send the email in the first place. The second helps me think rationally. If there is 1 out of 100 worlds where Bob is gravely offended by my email, and replies saying that he thinks I’m a terrible person and that he’s never going to do business with me again, I have a natural tendency to only think about that singular world while sending the email. However, if I make a prediction and am forced to admit that in the other 99 worlds, Bob either doesn’t respond, or responds warmly, it is easier to appease the part of my brain that considers emailing Bob as a kind of threat.

Another set of questions I found helpful recently revolved around finding a new job. The first kind of question was to try to honestly estimate my chance of success for any given position, eg:

![Will Apple give me an interview?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/apple_interview.png&w=3840&q=75)
![Will ByteDance progress me through to the final stage?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/bytedance_progress.png&w=3840&q=75)
![Will either Apple, ByteDance or Cisco offer me a job by the end of July?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/apple_bytedance_cisco_job.png&w=3840&q=75)

These are useful to understand how to allocate my effort between different stages of the funnel - if one of the three companies in the last question is 90% likely to give me an offer, it’s probably not worth it for me to be sending out fresh applications. Similarly, if I notice that I am overconfident on questions like the first one, and get fewer interviews then I would’ve expected, this is a useful signal that I need to make some changes to my CV and try to get some more referrals. This proved extremely useful in my recent job search for knowing when to switch between mostly sending out new applications and mostly preparing for interviews.

There are other questions I used to help me to decide whether or not I ought to take a job, for example:

![If I join a startup, will they raise a Series A before 2026?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/startup_series_a.png&w=3840&q=75)
![If I join ByteDance, will I get a raise in my first year?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/bytedance_raise.png&w=3840&q=75)
![If I join Apple, will I still be working there in two years time?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/apple_in_two_years.png&w=3840&q=75)

Often in these situations I have a strong gut-feeling about which company to join, but it’s also a valuable exercise to see whether the numbers match up. Sometimes these [intuition pump](https://en.wikipedia.org/wiki/Intuition_pump)-style questions have been able to shift my actual intuitions. You could apply a similar kind of question to e.g. finding a new flat to rent, or a new romantic partner.

I’ve found these long-term “hill climb” predictions valuable too. Consider questions like:

![Will I finish my next ultramarathon within the time limit?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/ultra_in_time.png&w=3840&q=75)
![Will I found a new charity in 2024?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/new_charity.png&w=3840&q=75)
![Will I try a beginner's dance class in 2024?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/dance_class.png&w=3840&q=75)
![Will I meditate 100 times in 2024?](/_next/image?url=/blog/concrete-benefits-of-making-predictions/100_sits.png&w=3840&q=75)

If I string together some solid running weeks and nail my track sessions then I might be able to update the chance of completing the ultramarathon to 85%. This isn’t as satisfactory as crossing the finish line, but it does feel like a small reward for my hard work so far, and it might help motivate me to continue training as hard. Conversely, if I skip my Sunday long run in favour of a boozy brunch three weeks in a row, I’ll likely decrease the probability to 75%. This doesn’t feel great, but it’s not as bad as missing the goal altogether - in fact it might be just the harsh reminder I need that if I want to achieve my goals then I’m going to have to make sacrifices for them, and now is the time to course-correct.

## **How to track your predictions**

In order to get the maximum benefit from creating predictions, [deliberate practice](https://en.wikipedia.org/wiki/Practice_(learning_method)#Deliberate_practice) is required. I suggest the following steps:

1. Choose a way of recording your predictions. While a simple spreadsheet or notebook can work, I believe [Fatebook](https://fatebook.io/) is the best tool available, as it allows you to:
    1. Easily create, tag, share and resolve questions;
    2. Receive email reminders to update or resolve your predictions;
    3. Create teams and tournaments to share your predictions with others;
    4. Build a track record and understand your calibration at-a-glance.
2. Make some predictions. Think soberly about the probabilities involved, try to imagine what might happen in each of a hundred different worlds, try to notice your own biases and correct for them. If you’re not sure where to start, [Fatebook’s Predict Your Year feature](https://fatebook.io/predict-your-year) can offer you a wealth of inspiration.
3. (Optional) share your predictions with friends, coworkers, or the world at large. This can increase your accountability for reaching your goals, help you communicate with your team how long you think a project will take or elicit relevant information from others that you hadn’t yourself considered.
4. If necessary, update your predictions. When you do, reflect on what new information has caused the update, and whether there was a way you could have reasonably known this when you made the previous prediction. If so, plan on how to have that information next time.
5. Resolve the prediction. Again, take time to reflect on what information emerged at resolution time that you hadn’t considered previously, and whether there was a way this could’ve been factored into your predictions.
6. Over time, build up a track record which you can use to refine your predictions. If you consistently underestimate task duration by 50%, adjust future predictions accordingly. This iterative process of making predictions, observing outcomes, and recalibrating leads to increasingly accurate forecasts over time.

If you’re still unsure about how making predictions could be useful to you, then I’d like to help. Email me at [jonny@sage-future.org](mailto:jonny@sage-future.org) with a little bit about a problem/goal/thing you care about, and I’ll help you brainstorm predictions you could make that would be potentially valuable to you.
`
