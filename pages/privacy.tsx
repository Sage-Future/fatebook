import { NextSeo } from "next-seo"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function PrivacyPage() {
  return (
    <div className="prose mx-auto my-8">
      <NextSeo title="Privacy" />
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyMd}</ReactMarkdown>
    </div>
  )
}

const privacyMd = String.raw`
Privacy Policy for Fatebook
==================================

_If you have questions about our privacy policy or want us to change something, get in touch at hello@sage-future.org._

At Fatebook, accessible from fatebook.io and through our app for Slack, Chrome, and API, a core priority is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Fatebook and how we use it.

This Privacy Policy applies only to our online activities and is valid for visitors to our website and app for Slack with regards to the information that they shared and/or collect in Fatebook. This policy is not applicable to any information collected offline.

Consent
-------

By using our website, you hereby consent to our Privacy Policy and agree to its terms.

Information we collect
----------------------

The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.

If you contact us directly, we may receive additional information about you such as your name, email address, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.

You can register for an Account by signing in with Google or using the Slack app. When you do so, we receive your Google/Slack account's name (to set your username in Fatebook), email address (to send you email notifications, if you use the web app) and your profile picture URL (to set your profile picture in Fatebook).

How we use your information
---------------------------

We use the information we collect in various ways, including to:

-   Provide, operate, and maintain our website
-   Understand and analyze how you use our website
-   Send you emails or Slack messages. You can unsubscribe from these at any time.
-   Find and prevent fraud

**We never look at your privately shared forecasting questions unless you explicitly share them with us.** We may calculate aggregate statistics, e.g. to calculate the average accuracy of all Fatebook users or count the number of forecasts made per day on Fatebook.

Log files
---------

Fatebook follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.

CCPA Privacy Rights (Do Not Sell My Personal Information)
---------------------------------------------------------

Under the CCPA, among other rights, California consumers have the right to:

Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers.

Request that a business delete any personal data about the consumer that a business has collected.

Request that a business that sells a consumer's personal data, not sell the consumer's personal data.

If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.

GDPR Data Protection Rights
---------------------------

We will retain your personal data indefinitely, so that you can continue to use the service. If you would like us to delete your data, please contact us.

We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:

The right to access -- You have the right to request copies of your personal data. You can export all your data from Fatebook at any time - click "Export all your forecasts".

The right to rectification -- You have the right to request that we correct any information you believe is inaccurate. You also have the right to request that we complete the information you believe is incomplete.

The right to erasure -- You have the right to request that we erase your personal data, under certain conditions.

The right to restrict processing -- You have the right to request that we restrict the processing of your personal data, under certain conditions.

The right to object to processing -- You have the right to object to our processing of your personal data, under certain conditions.

The right to data portability -- You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.

If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.

Children's Information
----------------------

Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.

Fatebook does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.

Changes to This Privacy Policy
------------------------------

We may update our Privacy Policy from time to time. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page. These changes are effective immediately, after they are posted on this page.

Contact Us
----------

If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at hello@sage-future.org.`
