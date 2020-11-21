# Accessibility Announcer

A tool to do aria-live announcements.

## About

*This project is pretty much in a work-in-progress proof-of-concept state. More docs and examples are to come.*

A dynamic web application might require to do screen reader announcements for the state changes. The browsers lack a direct API to ask the screen reader to say something, we only have aria-live regions.

The problem with the announcements using aria-live is that the aria-live node should be present in the DOM and should be accessible by the screen reader navigation which might be confusing. One of the standard practices is to remove the contents of the aria-live element after some timeout hoping that it's already announced. Which is very fragile and unpredictable.

This module does the same announcements using aria-live regions, but it wraps them inside a sematically meaningful container which is navigable and visible by the screen reader only. This container removes the confusion for the screen reader user, it increases predictability of the announcements (because the text is not removed after short timeout). It also provides a convenient access to the recent announcements history.

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
