# n8n-nodes-govseer

The [Govseer](https://govseer.com) node for [n8n](https://n8n.io). Send a safety data sheet (PDF) and get back what a seller needs from it, each answer citing the rule it comes from.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, and install `n8n-nodes-govseer`.

## Operations

**Safety Data Sheet**

- **Get EU Label**: the EU CLP label elements an online listing must show (pictograms, signal word, hazard and precautionary statements in their official wording, the "Contains" line), in any of the 24 EU languages, with what the sheet leaves open.
- **Get Marketplace Fields**: the hazard fields bol.com, eBay and Amazon EU ask sellers for.
- **Get Shipping Fields**: UN number, proper shipping name, hazard class and packing group from section 14, with the US ground limited quantity rule for that class and packing group.
- **Check Against OSHA HCS and WHMIS**: what the sheet lacks under OSHA HCS 2024 and Canada's WHMIS, with the rule behind each gap.

**Rule Change**

- **Get Many**: dated rule changes ahead for EU CLP, OSHA HCS, WHMIS, Quebec French labels, CPSC eFiling and Amazon dangerous goods, each with its official source.

## Credentials

You need a Govseer API key:

1. Sign in at [govseer.com](https://govseer.com) and open your account page.
2. Create an API key and copy it. It is shown once.
3. In n8n, create a **Govseer API** credential and paste the key.

A free plan is available. Plans and limits: [govseer.com/docs/api](https://govseer.com/docs/api).

## Usage

The sheet operations read a safety data sheet (PDF) from a binary field (by default `data`), for example from an HTTP Request, Google Drive or email trigger node. Each sheet counts once against your monthly allowance, whatever the number of languages. Sheets are read once and not stored.

The node can also be used as a tool by an AI Agent node.

### Example: the German and French label from a sheet at a web address

1. **HTTP Request** node: Method `GET`, URL of the PDF (for example `https://example.com/sds/citrus-cleaner.pdf`). Under **Options → Response**, set **Response Format** to `File` and **Put Output in Field** to `data`.
2. **Govseer** node: Resource **Safety Data Sheet**, Operation **Get EU Label**, **Input Binary Field** `data`, **Label Languages** `German` and `French`.

The Govseer node returns one item per sheet. Shortened:

```json
{
  "extraction": {
    "productIdentifier": "Citrus Surface Cleaner",
    "signalWord": "Danger",
    "pictograms": ["GHS05", "GHS07"],
    "hazardStatements": ["H318", "H315"],
    "precautionaryStatements": ["P280", "P305+P351+P338", "P501"],
    "language": "EN"
  },
  "labels": {
    "DE": {
      "signalWord": { "code": "Danger", "text": "Gefahr" },
      "pictograms": ["GHS05", "GHS07"],
      "hazards": [
        { "code": "H318", "text": "Verursacht schwere Augenschäden." },
        { "code": "H315", "text": "Verursacht Hautreizungen." }
      ],
      "precautions": [{ "code": "P501", "text": "Inhalt/Behälter … zuführen.", "openBlank": true }],
      "contains": { "names": ["sodium lauryl sulphate"], "text": "Enthält sodium lauryl sulphate." },
      "findings": [{ "severity": "warning", "message": "P501 needs the disposal route filled in.", "reference": "CLP Art. 28" }]
    },
    "FR": { "signalWord": { "code": "Danger", "text": "Danger" }, "...": "..." }
  },
  "usage": { "month": "2026-12", "checks": 3, "limit": 100 }
}
```

In a later node, map fields with expressions, for example the German signal word `{{ $json.labels.DE.signalWord.text }}` or all German hazard statements as one line `{{ $json.labels.DE.hazards.map(h => h.text).join(' ') }}`. `openBlank: true` marks a statement with a blank the sheet does not fill (here, where to dispose of the product).

The other sheet operations work the same way: **Get Marketplace Fields** returns `markets` (one entry per marketplace with its fields), **Get Shipping Fields** returns `shipping` (`unNumber`, `shippingName`, `hazardClass`, `packingGroup`, `limitedQuantity`), and **Check Against OSHA HCS and WHMIS** returns `check.us` and `check.ca` with the gaps and the rule behind each.

### Example: a weekly note of rule changes ahead

1. **Schedule Trigger** node: every week.
2. **Govseer** node: Resource **Rule Change**, Operation **Get Many**, **Areas** `CPSC eFiling` and `OSHA HCS and WHMIS`. No sheet is read and nothing is counted.
3. **Split Out** node: field `rules`, one item per rule.
4. **Filter** node: `{{ $json.state }}` is equal to `upcoming`, then send the items by email or to Slack.

The Govseer node returns one item; each rule has its date, state (`pending`, `upcoming` or `since`) and official source:

```json
{
  "version": "upcoming-2026-11-22",
  "rules": [
    {
      "id": "cpsc-efiling-ftz",
      "region": "US",
      "date": "2027-01-08",
      "state": "upcoming",
      "title": "eFiling for Foreign Trade Zone entries",
      "text": "Products entered from a Foreign Trade Zone must also have their certificate data eFiled.",
      "source": { "name": "CPSC eFiling Frequently Asked Questions (Foreign Trade Zone entries)", "url": "https://www.cpsc.gov/FAQ/eFiling-Frequently-Asked-Questions-FAQ" },
      "checked": "2026-11-14"
    }
  ]
}
```

## Resources

- [Govseer API documentation](https://govseer.com/docs/api)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Support: [govseer.com/support](https://govseer.com/support)

The results are a tool, not legal advice.

## Version history

- 0.1.2: worked examples in this README (n8n review). No change to the node.
- 0.1.1: published through npm trusted publishing; the free plan's limit is no longer repeated here. No change to the node.
- 0.1.0: first release.
