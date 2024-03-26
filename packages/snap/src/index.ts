import type { OnTransactionHandler } from '@metamask/snaps-sdk';
import { panel, heading, text, divider } from '@metamask/snaps-sdk';

const networks: Map<string, string> = new Map<string, string>([["1", "ETH"], ["38", "BSC"], ["137", "POL"], ["A", "OP"], ["FA", "FTM"], ["2105", "BASE"]]);

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  chainId,
  transactionOrigin,

}) => {

  let parts = chainId.split(':');

  if (parts.length !== 2) {
    return { content: invalidNetwork(chainId) };
  }

  let id = parts[1];
  if (id === undefined) {
    return { content: invalidNetwork(chainId) };
  }

  let network = networks.get(id) as string;

  if (network === undefined) {
    return { content: invalidNetwork(chainId) };
  }

  const queryString = `
  {
    facets(network: ${network}, example: {of: "contracts/${transaction.to}"})
    {
      threat{... on Label{tag} ... on Threat{risk confidence}}
      notes{key value}
      category
    }
  }
  `;
  
  let result: any;
  try {
    const response = await fetch(
      'https://34.120.26.253.nip.io/widget/query',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: queryString,
        }),
      },
    );
    if (!response.ok) {
      return { content: panel([
        heading('Trugard Labs Labs'),
         text('invalid response'),
       ])}
    }
    result = await response.json();
    if (result.data === undefined) {
      return { content: panel([
        heading('Trugard Labs'),
         text('no content'),
       ])}
    }

    let report = [];
    
    if (result.data.facets === undefined || result.data.facets === null) {
      report.push(text("No facets found"));
      return { content: panel([
        heading('Trugard Labs'),
         ...report,
       ])}
    }

    if (result.data.facets.length === 0) {
      report.push(text("Contract is Unremarkable"));
      return { content: panel([
        heading('Trugard Labs'),
         ...report,
       ])}
    }

    let high_risk_count = 0;
    let medium_risk_count = 0;
    let low_risk_count = 0;
    let unassigned_risk_count = 0;
    let none_risk_count = 0;

    result.data.facets.forEach((element: any) => {
      try {
        if (element !== undefined || element !== null) {
          if (element.threat !== undefined || element.threat !== null) {

              let risk = element.threat.risk;

              if (risk === undefined || risk === null || risk === "") {
                risk = "UNASSIGNED";
              }

              if (risk === "HIGH") {
                high_risk_count++;
              } else if (risk === "MEDIUM") {
                medium_risk_count++;
              } else if (risk === "LOW") {
                low_risk_count++;
              } else if (risk === "NONE") {
                none_risk_count++;
              } else {
                unassigned_risk_count++;
              }
          }
        } 
      } catch (error) {
        console.log(error);
      }
    });
   
    report.push(text("Risk Report"));
    report.push(divider());
    if (high_risk_count !== 0) {
      report.push(text("High Risk: " + high_risk_count));
    }

    if (medium_risk_count !== 0) {
      report.push(text("Medium Risk: " + medium_risk_count));
    }

    if (low_risk_count !== 0) {
      report.push(text("Low Risk: " + low_risk_count));
    }

    if (unassigned_risk_count !== 0 || none_risk_count !== 0) {
      report.push(text("Unassigned Risk: " + unassigned_risk_count + none_risk_count));
    }

    report.push(divider());
    report.push(text("For more information, visit https://devportal.trugardlabs.xyz"));

    return { content: panel([
       ...report,
     ])}

  } catch (error) {
    return { content: panel([
      heading('Trugard SHIELD'),
       text("Something went wrong."),
     ])}
  }
}

function invalidNetwork(chainId: string) {
  return panel([
    heading('Trugard Labs'),
     text('invalid chainId: ' + chainId),
   ]);
  }