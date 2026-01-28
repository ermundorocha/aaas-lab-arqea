export function buildDrawio({ title, nodes }) {
  const a = nodes?.[0]?.label || "Frontend (OnePage)";
  const b = nodes?.[1]?.label || "Backend IA Seguro (API)";
  const c = nodes?.[2]?.label || "Artefatos + GitOps + Publicação";

  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net">
  <diagram name="${escapeXml(title || "AaaS")}">
    <mxGraphModel dx="1200" dy="800" grid="1" gridSize="10">
      <root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>

        <mxCell id="2" value="${escapeXml(a)}" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="60" y="140" width="240" height="90" as="geometry"/>
        </mxCell>

        <mxCell id="3" value="${escapeXml(b)}" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="360" y="140" width="280" height="90" as="geometry"/>
        </mxCell>

        <mxCell id="4" value="${escapeXml(c)}" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
          <mxGeometry x="720" y="140" width="280" height="90" as="geometry"/>
        </mxCell>

        <mxCell id="5" style="endArrow=block;html=1;" edge="1" parent="1" source="2" target="3">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

        <mxCell id="6" style="endArrow=block;html=1;" edge="1" parent="1" source="3" target="4">
          <mxGeometry relative="1" as="geometry"/>
        </mxCell>

      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, c => ({
    "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;"
  }[c]));
}