using scada_demo_test.Domain.Enums;

namespace scada_demo_test.Domain.Drivers;

public class KaifengFlowmeterDriver : ISensorDriver
{
    public string DriverKey => "KAIFENG_FLOWMETER";
    public string SimpleName => "kaifeng";
    public string DisplayName => "Kaifeng Flowmeter";
    public string Description => "General Kaifeng flowmeter (flow rate and totalizer, Nm³/h)";

    public byte FunctionCode => 0x03;
    public ushort StartRegister => 0x0000;
    public ushort RegisterQuantity => 4;

    public string UnitPrimary => "Nm³/h";
    public string UnitSecondary => "Nm³";
    public string PrimaryColumnName => "InstantaneousFlowRate";
    public string SecondaryColumnName => "AccumulatedTotalizer";

    public int DefaultSlaveAddress => 0x01;
    public int DefaultPollIntervalSeconds => 3;

    public ParsedTelemetry ParseData(byte[] rawRegisters)
    {
        if (rawRegisters == null || rawRegisters.Length < 8)
        {
            return new ParsedTelemetry { Success = false, ErrorCode = "INVALID_PAYLOAD" };
        }

        var flowRate = ModbusValueCodec.ReadFloat32HighWordFirst(rawRegisters, 0);
        var totalizer = ModbusValueCodec.ReadFloat32HighWordFirst(rawRegisters, 4);

        return new ParsedTelemetry
        {
            Success = true,
            PrimaryValue = Math.Round(flowRate, 4),
            SecondaryValue = Math.Round(totalizer, 3)
        };
    }

    public bool ValidatePayloadStructure(byte[] rawPayload) => rawPayload != null && rawPayload.Length == 8;

    public bool ValidateValueBoundaries(byte[] rawPayload)
    {
        if (rawPayload == null || rawPayload.Length < 8) return false;
        var f1 = ModbusValueCodec.ReadFloat32HighWordFirst(rawPayload, 0);
        var f2 = ModbusValueCodec.ReadFloat32HighWordFirst(rawPayload, 4);
        if (double.IsNaN(f1) || double.IsInfinity(f1)) return false;
        if (double.IsNaN(f2) || double.IsInfinity(f2)) return false;
        if (f1 < 0 || f1 > 1e7) return false;
        if (f2 < 0 || f2 > 1e12) return false;
        return true;
    }
}
