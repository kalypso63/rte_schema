RTE.default{
    showButtons := addToList(schemaattr)
    #Schema configuration optional
    #buttons.schemaattr.allowTags = span
    #buttons.schemaattr.allowSchemaType = Product,Article,LocalBusiness,Brand
    proc{
        #keepPDIVattribs := addToList(itemscope, itemtype, itemprop)
        entryHTMLparser_db{
            tags{
                #list of yout tags
                #span.allowedAttribs := addToList(itemscope, itemtype, itemprop)
            }
        }
    }
}