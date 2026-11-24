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

The free plan includes 25 sheets a month. Plans and limits: [govseer.com/docs/api](https://govseer.com/docs/api).

## Usage

The sheet operations read a PDF from a binary field (by default `data`), for example from an HTTP Request, Google Drive or email trigger node. Each sheet counts once against your monthly allowance, whatever the number of languages. Sheets are read once and not stored.

The node can also be used as a tool by an AI Agent node.

## Resources

- [Govseer API documentation](https://govseer.com/docs/api)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Support: [govseer.com/support](https://govseer.com/support)

The results are a tool, not legal advice.

## Version history

- 0.1.0: first release.
